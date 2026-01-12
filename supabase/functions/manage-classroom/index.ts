import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateClassroomRequest {
  action: 'create_classroom';
  name: string;
}

interface AddStudentRequest {
  action: 'add_student';
  classroom_id: string;
  name: string;
  avatar_emoji?: string;
}

interface AwardPointsRequest {
  action: 'award_points';
  student_id: string;
  points: number;
  reason: string;
}

interface RemoveStudentRequest {
  action: 'remove_student';
  student_id: string;
}

interface UpdateStudentRequest {
  action: 'update_student';
  student_id: string;
  name?: string;
  avatar_emoji?: string;
}

interface LinkStudentRequest {
  action: 'link_student';
  student_id: string;
  classroom_code: string;
  kid_id: string;
}

type RequestBody = CreateClassroomRequest | AddStudentRequest | AwardPointsRequest | RemoveStudentRequest | UpdateStudentRequest | LinkStudentRequest;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with user's token for auth
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: RequestBody = await req.json();

    // Service role client for bypassing RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    switch (body.action) {
      case 'create_classroom': {
        // Generate a unique classroom code
        const { data: codeData, error: codeError } = await supabaseAdmin.rpc('generate_classroom_code');
        if (codeError) throw codeError;

        // Create the classroom
        const { data: classroom, error: classroomError } = await supabaseAdmin
          .from('classrooms')
          .insert({
            name: body.name,
            teacher_id: user.id,
            classroom_code: codeData,
          })
          .select()
          .single();

        if (classroomError) throw classroomError;

        // Add teacher role if not exists
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: user.id,
            role: 'teacher',
          }, { onConflict: 'user_id,role' });

        if (roleError && !roleError.message.includes('duplicate')) throw roleError;

        return new Response(JSON.stringify({ success: true, classroom }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'add_student': {
        // Verify teacher owns this classroom
        const { data: classroom, error: classroomError } = await supabaseAdmin
          .from('classrooms')
          .select('id')
          .eq('id', body.classroom_id)
          .eq('teacher_id', user.id)
          .single();

        if (classroomError || !classroom) {
          return new Response(JSON.stringify({ error: 'Classroom not found or unauthorized' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Generate student number
        const { data: studentNumber, error: numError } = await supabaseAdmin.rpc(
          'generate_student_number',
          { p_classroom_id: body.classroom_id }
        );
        if (numError) throw numError;

        // Random avatar if not provided
        const avatars = ['🐲', '🦊', '🐺', '🦁', '🐯', '🐻', '🐼', '🐨', '🦄', '🦋', '🐢', '🦀', '🐬', '🦅', '🦉'];
        const avatar = body.avatar_emoji || avatars[Math.floor(Math.random() * avatars.length)];

        // Create the student
        const { data: student, error: studentError } = await supabaseAdmin
          .from('students')
          .insert({
            classroom_id: body.classroom_id,
            name: body.name,
            avatar_emoji: avatar,
            student_number: studentNumber,
            school_points: 0,
          })
          .select()
          .single();

        if (studentError) throw studentError;

        return new Response(JSON.stringify({ success: true, student }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'award_points': {
        // Verify teacher owns the student's classroom
        const { data: student, error: studentError } = await supabaseAdmin
          .from('students')
          .select('id, classroom_id, school_points, classrooms!inner(teacher_id)')
          .eq('id', body.student_id)
          .single();

        if (studentError || !student) {
          return new Response(JSON.stringify({ error: 'Student not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const classroomData = student.classrooms as unknown as { teacher_id: string };
        if (classroomData.teacher_id !== user.id) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update student points
        const newPoints = (student.school_points || 0) + body.points;
        const { error: updateError } = await supabaseAdmin
          .from('students')
          .update({ school_points: newPoints })
          .eq('id', body.student_id);

        if (updateError) throw updateError;

        // Log the points
        const { error: logError } = await supabaseAdmin
          .from('school_points_log')
          .insert({
            student_id: body.student_id,
            points: body.points,
            reason: body.reason,
            awarded_by: user.id,
          });

        if (logError) throw logError;

        // If student is linked to a kid, update their school time
        const { data: fullStudent } = await supabaseAdmin
          .from('students')
          .select('linked_kid_id')
          .eq('id', body.student_id)
          .single();

        if (fullStudent?.linked_kid_id) {
          // Each point = 1 minute of Lola time from school
          const { data: kid, error: kidError } = await supabaseAdmin
            .from('kids')
            .select('lola_time_from_school')
            .eq('id', fullStudent.linked_kid_id)
            .single();

          if (!kidError && kid) {
            await supabaseAdmin
              .from('kids')
              .update({ 
                lola_time_from_school: (kid.lola_time_from_school || 0) + body.points 
              })
              .eq('id', fullStudent.linked_kid_id);
          }
        }

        return new Response(JSON.stringify({ success: true, new_points: newPoints }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'remove_student': {
        // Verify teacher owns the student's classroom
        const { data: student, error: studentError } = await supabaseAdmin
          .from('students')
          .select('id, classrooms!inner(teacher_id)')
          .eq('id', body.student_id)
          .single();

        if (studentError || !student) {
          return new Response(JSON.stringify({ error: 'Student not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const classroomData = student.classrooms as unknown as { teacher_id: string };
        if (classroomData.teacher_id !== user.id) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error: deleteError } = await supabaseAdmin
          .from('students')
          .delete()
          .eq('id', body.student_id);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_student': {
        // Verify teacher owns the student's classroom
        const { data: student, error: studentError } = await supabaseAdmin
          .from('students')
          .select('id, classrooms!inner(teacher_id)')
          .eq('id', body.student_id)
          .single();

        if (studentError || !student) {
          return new Response(JSON.stringify({ error: 'Student not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const classroomData = student.classrooms as unknown as { teacher_id: string };
        if (classroomData.teacher_id !== user.id) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const updates: Record<string, string> = {};
        if (body.name) updates.name = body.name;
        if (body.avatar_emoji) updates.avatar_emoji = body.avatar_emoji;

        const { error: updateError } = await supabaseAdmin
          .from('students')
          .update(updates)
          .eq('id', body.student_id);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'link_student': {
        // Parent linking their kid to a classroom student
        // First verify the classroom code is valid
        const { data: classroom, error: classroomError } = await supabaseAdmin
          .from('classrooms')
          .select('id')
          .eq('classroom_code', body.classroom_code.toUpperCase())
          .single();

        if (classroomError || !classroom) {
          return new Response(JSON.stringify({ error: 'Invalid classroom code' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify the student exists and belongs to this classroom
        const { data: student, error: studentError } = await supabaseAdmin
          .from('students')
          .select('id, classroom_id')
          .eq('id', body.student_id)
          .eq('classroom_id', classroom.id)
          .single();

        if (studentError || !student) {
          return new Response(JSON.stringify({ error: 'Student not found in this classroom' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify the user owns this kid
        const { data: kid, error: kidError } = await supabaseAdmin
          .from('kids')
          .select('id, family_id')
          .eq('id', body.kid_id)
          .single();

        if (kidError || !kid) {
          return new Response(JSON.stringify({ error: 'Kid not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify user is a family member
        const { data: membership, error: memberError } = await supabaseAdmin
          .from('family_members')
          .select('id')
          .eq('family_id', kid.family_id)
          .eq('user_id', user.id)
          .single();

        if (memberError || !membership) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Link the student to the kid
        const { error: linkError } = await supabaseAdmin
          .from('students')
          .update({ linked_kid_id: body.kid_id })
          .eq('id', body.student_id);

        if (linkError) throw linkError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

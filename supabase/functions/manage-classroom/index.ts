import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helpers
const validateString = (value: unknown, fieldName: string, minLen = 1, maxLen = 255): string | null => {
  if (typeof value !== 'string') return `${fieldName} must be a string`;
  const trimmed = value.trim();
  if (trimmed.length < minLen) return `${fieldName} must be at least ${minLen} character(s)`;
  if (trimmed.length > maxLen) return `${fieldName} must be less than ${maxLen} characters`;
  return null;
};

const validatePoints = (value: unknown): string | null => {
  if (typeof value !== 'number') return 'Points must be a number';
  if (!Number.isInteger(value)) return 'Points must be a whole number';
  if (value < 1) return 'Points must be at least 1';
  if (value > 100) return 'Points cannot exceed 100';
  return null;
};

const validateUUID = (value: unknown, fieldName: string): string | null => {
  if (typeof value !== 'string') return `${fieldName} must be a string`;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) return `${fieldName} must be a valid UUID`;
  return null;
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

interface UnlinkStudentRequest {
  action: 'unlink_student';
  student_id: string;
}

interface BulkAddStudentsRequest {
  action: 'bulk_add_students';
  classroom_id: string;
  students: Array<{ name: string; avatar_emoji?: string }>;
}

interface StudentJoinRequest {
  action: 'student_join';
  classroom_code: string;
}

interface UpdateStudentStatusRequest {
  action: 'update_student_status';
  student_id: string;
  status: 'active' | 'removed';
}

type RequestBody = CreateClassroomRequest | AddStudentRequest | AwardPointsRequest | RemoveStudentRequest | UpdateStudentRequest | LinkStudentRequest | UnlinkStudentRequest | BulkAddStudentsRequest | StudentJoinRequest | UpdateStudentStatusRequest;

const errorResponse = (message: string, status: number) => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('No authorization header', 401);
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
      return errorResponse('Invalid token', 401);
    }

    const body: RequestBody = await req.json();

    // Service role client for bypassing RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    switch (body.action) {
      case 'create_classroom': {
        // Validate input
        const nameError = validateString(body.name, 'Classroom name', 1, 100);
        if (nameError) return errorResponse(nameError, 400);

        // Generate a unique classroom code
        const { data: codeData, error: codeError } = await supabaseAdmin.rpc('generate_classroom_code');
        if (codeError) throw codeError;

        // Create the classroom
        const { data: classroom, error: classroomError } = await supabaseAdmin
          .from('classrooms')
          .insert({
            name: body.name.trim(),
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
        // Validate inputs
        const classroomIdError = validateUUID(body.classroom_id, 'Classroom ID');
        if (classroomIdError) return errorResponse(classroomIdError, 400);

        const nameError = validateString(body.name, 'Student name', 1, 100);
        if (nameError) return errorResponse(nameError, 400);

        if (body.avatar_emoji) {
          const emojiError = validateString(body.avatar_emoji, 'Avatar emoji', 1, 10);
          if (emojiError) return errorResponse(emojiError, 400);
        }

        // Verify teacher owns this classroom
        const { data: classroom, error: classroomError } = await supabaseAdmin
          .from('classrooms')
          .select('id')
          .eq('id', body.classroom_id)
          .eq('teacher_id', user.id)
          .single();

        if (classroomError || !classroom) {
          return errorResponse('Classroom not found or unauthorized', 403);
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
            name: body.name.trim(),
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
        // Validate inputs
        const studentIdError = validateUUID(body.student_id, 'Student ID');
        if (studentIdError) return errorResponse(studentIdError, 400);

        const pointsError = validatePoints(body.points);
        if (pointsError) return errorResponse(pointsError, 400);

        const reasonError = validateString(body.reason, 'Reason', 1, 500);
        if (reasonError) return errorResponse(reasonError, 400);

        // Verify teacher owns the student's classroom
        const { data: student, error: studentError } = await supabaseAdmin
          .from('students')
          .select('id, classroom_id, school_points, classrooms!inner(teacher_id)')
          .eq('id', body.student_id)
          .single();

        if (studentError || !student) {
          return errorResponse('Student not found', 404);
        }

        const classroomData = student.classrooms as unknown as { teacher_id: string };
        if (classroomData.teacher_id !== user.id) {
          return errorResponse('Unauthorized', 403);
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
            reason: body.reason.trim(),
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
        // Validate input
        const studentIdError = validateUUID(body.student_id, 'Student ID');
        if (studentIdError) return errorResponse(studentIdError, 400);

        // Verify teacher owns the student's classroom
        const { data: student, error: studentError } = await supabaseAdmin
          .from('students')
          .select('id, classrooms!inner(teacher_id)')
          .eq('id', body.student_id)
          .single();

        if (studentError || !student) {
          return errorResponse('Student not found', 404);
        }

        const classroomData = student.classrooms as unknown as { teacher_id: string };
        if (classroomData.teacher_id !== user.id) {
          return errorResponse('Unauthorized', 403);
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
        // Validate input
        const studentIdError = validateUUID(body.student_id, 'Student ID');
        if (studentIdError) return errorResponse(studentIdError, 400);

        if (body.name) {
          const nameError = validateString(body.name, 'Student name', 1, 100);
          if (nameError) return errorResponse(nameError, 400);
        }

        if (body.avatar_emoji) {
          const emojiError = validateString(body.avatar_emoji, 'Avatar emoji', 1, 10);
          if (emojiError) return errorResponse(emojiError, 400);
        }

        // Verify teacher owns the student's classroom
        const { data: student, error: studentError } = await supabaseAdmin
          .from('students')
          .select('id, classrooms!inner(teacher_id)')
          .eq('id', body.student_id)
          .single();

        if (studentError || !student) {
          return errorResponse('Student not found', 404);
        }

        const classroomData = student.classrooms as unknown as { teacher_id: string };
        if (classroomData.teacher_id !== user.id) {
          return errorResponse('Unauthorized', 403);
        }

        const updates: Record<string, string> = {};
        if (body.name) updates.name = body.name.trim();
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
        // Validate inputs
        const studentIdError = validateUUID(body.student_id, 'Student ID');
        if (studentIdError) return errorResponse(studentIdError, 400);

        const kidIdError = validateUUID(body.kid_id, 'Kid ID');
        if (kidIdError) return errorResponse(kidIdError, 400);

        const codeError = validateString(body.classroom_code, 'Classroom code', 4, 20);
        if (codeError) return errorResponse(codeError, 400);

        // Parent linking their kid to a classroom student
        // First verify the classroom code is valid
        const { data: classroom, error: classroomError } = await supabaseAdmin
          .from('classrooms')
          .select('id')
          .eq('classroom_code', body.classroom_code.toUpperCase())
          .single();

        if (classroomError || !classroom) {
          return errorResponse('Invalid classroom code', 404);
        }

        // Verify the student exists and belongs to this classroom
        const { data: student, error: studentError } = await supabaseAdmin
          .from('students')
          .select('id, classroom_id, linked_kid_id')
          .eq('id', body.student_id)
          .eq('classroom_id', classroom.id)
          .single();

        if (studentError || !student) {
          return errorResponse('Student not found in this classroom', 404);
        }

        // Check if student is already linked
        if (student.linked_kid_id) {
          return errorResponse('Student is already linked to a family account', 400);
        }

        // Verify the user owns this kid
        const { data: kid, error: kidError } = await supabaseAdmin
          .from('kids')
          .select('id, family_id')
          .eq('id', body.kid_id)
          .single();

        if (kidError || !kid) {
          return errorResponse('Kid not found', 404);
        }

        // Verify user is a family member
        const { data: membership, error: memberError } = await supabaseAdmin
          .from('family_members')
          .select('id')
          .eq('family_id', kid.family_id)
          .eq('user_id', user.id)
          .single();

        if (memberError || !membership) {
          return errorResponse('Unauthorized', 403);
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

      case 'unlink_student': {
        // Validate input
        const studentIdError = validateUUID(body.student_id, 'Student ID');
        if (studentIdError) return errorResponse(studentIdError, 400);

        // Get the student and check if it's linked
        const { data: student, error: studentError } = await supabaseAdmin
          .from('students')
          .select('id, linked_kid_id')
          .eq('id', body.student_id)
          .single();

        if (studentError || !student) {
          return errorResponse('Student not found', 404);
        }

        if (!student.linked_kid_id) {
          return errorResponse('Student is not linked to any family', 400);
        }

        // Verify the user is a family member of the linked kid
        const { data: kid, error: kidError } = await supabaseAdmin
          .from('kids')
          .select('id, family_id')
          .eq('id', student.linked_kid_id)
          .single();

        if (kidError || !kid) {
          return errorResponse('Linked kid not found', 404);
        }

        const { data: membership, error: memberError } = await supabaseAdmin
          .from('family_members')
          .select('id')
          .eq('family_id', kid.family_id)
          .eq('user_id', user.id)
          .single();

        if (memberError || !membership) {
          return errorResponse('Unauthorized', 403);
        }

        // Unlink the student
        const { error: unlinkError } = await supabaseAdmin
          .from('students')
          .update({ linked_kid_id: null })
          .eq('id', body.student_id);

        if (unlinkError) throw unlinkError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'bulk_add_students': {
        // Validate inputs
        const classroomIdError = validateUUID(body.classroom_id, 'Classroom ID');
        if (classroomIdError) return errorResponse(classroomIdError, 400);

        if (!Array.isArray(body.students)) {
          return errorResponse('Students must be an array', 400);
        }

        if (body.students.length === 0) {
          return errorResponse('At least one student is required', 400);
        }

        if (body.students.length > 50) {
          return errorResponse('Cannot add more than 50 students at once', 400);
        }

        // Validate each student entry
        for (let i = 0; i < body.students.length; i++) {
          const studentData = body.students[i];
          const nameError = validateString(studentData.name, `Student ${i + 1} name`, 1, 100);
          if (nameError) return errorResponse(nameError, 400);

          if (studentData.avatar_emoji) {
            const emojiError = validateString(studentData.avatar_emoji, `Student ${i + 1} avatar`, 1, 10);
            if (emojiError) return errorResponse(emojiError, 400);
          }
        }

        // Verify teacher owns this classroom
        const { data: classroom, error: classroomError } = await supabaseAdmin
          .from('classrooms')
          .select('id')
          .eq('id', body.classroom_id)
          .eq('teacher_id', user.id)
          .single();

        if (classroomError || !classroom) {
          return errorResponse('Classroom not found or unauthorized', 403);
        }

        const avatars = ['🐲', '🦊', '🐺', '🦁', '🐯', '🐻', '🐼', '🐨', '🦄', '🦋', '🐢', '🦀', '🐬', '🦅', '🦉'];
        const addedStudents = [];

        for (const studentData of body.students) {
          // Generate student number
          const { data: studentNumber, error: numError } = await supabaseAdmin.rpc(
            'generate_student_number',
            { p_classroom_id: body.classroom_id }
          );
          if (numError) continue;

          const avatar = studentData.avatar_emoji || avatars[Math.floor(Math.random() * avatars.length)];

          const { data: student, error: studentError } = await supabaseAdmin
            .from('students')
            .insert({
              classroom_id: body.classroom_id,
              name: studentData.name.trim(),
              avatar_emoji: avatar,
              student_number: studentNumber,
              school_points: 0,
            })
            .select()
            .single();

          if (!studentError && student) {
            addedStudents.push(student);
          }
        }

        return new Response(JSON.stringify({ success: true, added_count: addedStudents.length, students: addedStudents }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'student_join': {
        // Student self-registration to a classroom
        const codeError = validateString(body.classroom_code, 'Classroom code', 4, 10);
        if (codeError) return errorResponse(codeError, 400);

        // Find the classroom
        const { data: classroom, error: classroomError } = await supabaseAdmin
          .from('classrooms')
          .select('id, name')
          .eq('classroom_code', body.classroom_code.toUpperCase())
          .maybeSingle();

        if (classroomError || !classroom) {
          return errorResponse('Classroom not found', 404);
        }

        // Check if student already joined this classroom
        const { data: existingStudent } = await supabaseAdmin
          .from('students')
          .select('id, status')
          .eq('classroom_id', classroom.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingStudent) {
          if (existingStudent.status === 'removed') {
            return errorResponse('You were removed from this classroom. Contact your teacher.', 403);
          }
          return errorResponse('You already joined this classroom', 400);
        }

        // Get user info for the student name
        const displayName = user.user_metadata?.full_name || 
                           user.user_metadata?.name || 
                           user.email?.split('@')[0] || 
                           'Student';

        // Generate student number
        const { data: studentNumber, error: numError } = await supabaseAdmin.rpc(
          'generate_student_number',
          { p_classroom_id: classroom.id }
        );
        if (numError) throw numError;

        // Random avatar
        const avatars = ['🐲', '🦊', '🐺', '🦁', '🐯', '🐻', '🐼', '🐨', '🦄', '🦋', '🐢', '🦀', '🐬', '🦅', '🦉'];
        const avatar = avatars[Math.floor(Math.random() * avatars.length)];

        // Create the student record
        const { data: student, error: studentError } = await supabaseAdmin
          .from('students')
          .insert({
            classroom_id: classroom.id,
            name: displayName,
            avatar_emoji: avatar,
            student_number: studentNumber,
            school_points: 0,
            user_id: user.id,
            email: user.email,
            status: 'active',
            joined_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (studentError) throw studentError;

        // Add child role if not exists
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: user.id,
            role: 'child',
          }, { onConflict: 'user_id,role' });

        if (roleError && !roleError.message.includes('duplicate')) {
          console.error('Role error:', roleError);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          student,
          classroom: { id: classroom.id, name: classroom.name }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_student_status': {
        // Teacher updating student status (verify/remove)
        const studentIdError = validateUUID(body.student_id, 'Student ID');
        if (studentIdError) return errorResponse(studentIdError, 400);

        if (!['active', 'removed'].includes(body.status)) {
          return errorResponse('Status must be "active" or "removed"', 400);
        }

        // Verify teacher owns the student's classroom
        const { data: student, error: studentError } = await supabaseAdmin
          .from('students')
          .select('id, classrooms!inner(teacher_id)')
          .eq('id', body.student_id)
          .single();

        if (studentError || !student) {
          return errorResponse('Student not found', 404);
        }

        const classroomData = student.classrooms as unknown as { teacher_id: string };
        if (classroomData.teacher_id !== user.id) {
          return errorResponse('Unauthorized', 403);
        }

        const { error: updateError } = await supabaseAdmin
          .from('students')
          .update({ status: body.status })
          .eq('id', body.student_id);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return errorResponse('Invalid action', 400);
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

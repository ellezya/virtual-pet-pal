import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface StoreItem {
  id: string;
  classroom_id: string;
  name: string;
  emoji: string;
  point_cost: number;
  description: string | null;
  is_digital: boolean;
  stock_quantity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreOrder {
  id: string;
  student_id: string;
  classroom_id: string;
  total_points: number;
  status: string;
  delivery_method: string;
  notes: string | null;
  approved_at: string | null;
  fulfilled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoreOrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  point_cost: number;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  classroom_id: string;
  delivery_days: string[];
  order_cutoff_time: string;
  delivery_window: string | null;
  is_store_open: boolean;
  created_at: string;
  updated_at: string;
}

export const useSchoolStore = (classroomId: string | null) => {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [orderItems, setOrderItems] = useState<StoreOrderItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchStoreData = async () => {
    if (!classroomId) {
      setItems([]);
      setOrders([]);
      setOrderItems([]);
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch store items
      const { data: itemsData, error: itemsError } = await supabase
        .from('store_items')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('point_cost', { ascending: true });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('store_orders')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Fetch order items for all orders
      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map(o => o.id);
        const { data: orderItemsData, error: orderItemsError } = await supabase
          .from('store_order_items')
          .select('*')
          .in('order_id', orderIds);

        if (orderItemsError) throw orderItemsError;
        setOrderItems(orderItemsData || []);
      }

      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('store_settings')
        .select('*')
        .eq('classroom_id', classroomId)
        .maybeSingle();

      if (settingsError) throw settingsError;
      setSettings(settingsData);

    } catch (error) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, [classroomId]);

  // Store Item Management
  const createItem = async (data: {
    name: string;
    emoji: string;
    point_cost: number;
    description?: string;
    is_digital: boolean;
    stock_quantity?: number;
  }) => {
    if (!classroomId) return null;

    try {
      const { data: item, error } = await supabase
        .from('store_items')
        .insert({
          ...data,
          classroom_id: classroomId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Item Created",
        description: `${data.name} added to store`,
      });

      fetchStoreData();
      return item;
    } catch (error) {
      console.error('Error creating item:', error);
      toast({
        title: "Error",
        description: "Failed to create store item",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateItem = async (itemId: string, updates: Partial<StoreItem>) => {
    try {
      const { error } = await supabase
        .from('store_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Item Updated",
        description: "Store item has been updated",
      });

      fetchStoreData();
      return true;
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update store item",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('store_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Item Deleted",
        description: "Store item has been removed",
      });

      fetchStoreData();
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete store item",
        variant: "destructive",
      });
      return false;
    }
  };

  // Order Management
  const createOrder = async (studentId: string, cartItems: { itemId: string; quantity: number }[]) => {
    if (!classroomId || !user) return null;

    try {
      // Calculate total
      const total = cartItems.reduce((sum, cartItem) => {
        const item = items.find(i => i.id === cartItem.itemId);
        return sum + (item ? item.point_cost * cartItem.quantity : 0);
      }, 0);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('store_orders')
        .insert({
          student_id: studentId,
          classroom_id: classroomId,
          total_points: total,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsToInsert = cartItems.map(cartItem => {
        const item = items.find(i => i.id === cartItem.itemId);
        return {
          order_id: order.id,
          item_id: cartItem.itemId,
          quantity: cartItem.quantity,
          point_cost: item?.point_cost || 0,
        };
      });

      const { error: itemsError } = await supabase
        .from('store_order_items')
        .insert(orderItemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: "Order Created",
        description: "Order placed successfully!",
      });

      fetchStoreData();
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    if (!user) return false;

    try {
      const updates: Record<string, unknown> = { status };
      
      if (status === 'approved') {
        updates.approved_at = new Date().toISOString();
        updates.approved_by = user.id;
      } else if (status === 'fulfilled') {
        updates.fulfilled_at = new Date().toISOString();
        updates.fulfilled_by = user.id;
      } else if (status === 'cancelled') {
        updates.cancelled_at = new Date().toISOString();
        updates.cancelled_by = user.id;
      }

      const { error } = await supabase
        .from('store_orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order Updated",
        description: `Order status changed to ${status}`,
      });

      fetchStoreData();
      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
      return false;
    }
  };

  // Store Settings
  const updateSettings = async (updates: Partial<StoreSettings>) => {
    if (!classroomId) return false;

    try {
      if (settings) {
        const { error } = await supabase
          .from('store_settings')
          .update(updates)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('store_settings')
          .insert({
            classroom_id: classroomId,
            ...updates,
          });

        if (error) throw error;
      }

      toast({
        title: "Settings Updated",
        description: "Store settings have been saved",
      });

      fetchStoreData();
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
      return false;
    }
  };

  // Helper functions
  const getOrderItems = (orderId: string) => {
    return orderItems.filter(oi => oi.order_id === orderId);
  };

  const getItemDetails = (itemId: string) => {
    return items.find(i => i.id === itemId);
  };

  const getPendingOrders = () => {
    return orders.filter(o => o.status === 'pending');
  };

  const getAvailableStock = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return 0;
    if (item.is_digital) return Infinity;
    
    // Calculate committed stock from pending orders
    const pendingOrderIds = orders.filter(o => o.status === 'pending').map(o => o.id);
    const committed = orderItems
      .filter(oi => pendingOrderIds.includes(oi.order_id) && oi.item_id === itemId)
      .reduce((sum, oi) => sum + oi.quantity, 0);
    
    return (item.stock_quantity || 0) - committed;
  };

  return {
    items,
    orders,
    orderItems,
    settings,
    loading,
    createItem,
    updateItem,
    deleteItem,
    createOrder,
    updateOrderStatus,
    updateSettings,
    getOrderItems,
    getItemDetails,
    getPendingOrders,
    getAvailableStock,
    refetch: fetchStoreData,
  };
};

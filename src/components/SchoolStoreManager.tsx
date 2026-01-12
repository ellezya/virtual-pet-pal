import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSchoolStore } from '@/hooks/useSchoolStore';
import { 
  Store, 
  Plus, 
  Package, 
  ShoppingCart, 
  Settings, 
  Trash2,
  Check,
  X,
  Edit,
  Printer
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  student_number: string;
  avatar_emoji: string;
  total_points: number;
}

interface SchoolStoreManagerProps {
  classroomId: string | null;
  students: Student[];
}

const ITEM_EMOJIS = ['🍬', '🎮', '📚', '🎟️', '🎨', '✏️', '🏀', '🎵', '🎪', '🌟'];

const SchoolStoreManager = ({ classroomId, students }: SchoolStoreManagerProps) => {
  const { 
    items, 
    orders, 
    settings,
    loading,
    createItem, 
    updateItem, 
    deleteItem,
    updateOrderStatus,
    getOrderItems,
    getItemDetails,
    getAvailableStock,
  } = useSchoolStore(classroomId);

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  
  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemEmoji, setNewItemEmoji] = useState('🎁');
  const [newItemCost, setNewItemCost] = useState(5);
  const [newItemDigital, setNewItemDigital] = useState(false);
  const [newItemStock, setNewItemStock] = useState(10);
  const [newItemDescription, setNewItemDescription] = useState('');

  const getStudent = (studentId: string) => students.find(s => s.id === studentId);

  const handleCreateItem = async () => {
    if (!newItemName.trim()) return;

    await createItem({
      name: newItemName,
      emoji: newItemEmoji,
      point_cost: newItemCost,
      description: newItemDescription || undefined,
      is_digital: newItemDigital,
      stock_quantity: newItemDigital ? undefined : newItemStock,
    });

    // Reset form
    setNewItemName('');
    setNewItemEmoji('🎁');
    setNewItemCost(5);
    setNewItemDigital(false);
    setNewItemStock(10);
    setNewItemDescription('');
    setShowAddItem(false);
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const approvedOrders = orders.filter(o => o.status === 'approved');
  const fulfilledOrders = orders.filter(o => o.status === 'fulfilled');

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading store...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            School Store
            {pendingOrders.length > 0 && (
              <Badge className="bg-primary text-primary-foreground ml-2">
                {pendingOrders.length} Pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="items">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="items" className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                Items
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-1">
                <ShoppingCart className="w-4 h-4" />
                Orders
                {pendingOrders.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {pendingOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="fulfillment" className="flex items-center gap-1">
                <Printer className="w-4 h-4" />
                Fulfillment
              </TabsTrigger>
            </TabsList>

            {/* Items Tab */}
            <TabsContent value="items">
              <div className="space-y-4">
                <Button
                  onClick={() => setShowAddItem(true)}
                  className="w-full bg-primary text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Store Item
                </Button>

                {items.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Store className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No items in store yet</p>
                    <p className="text-sm">Add items for students to redeem points</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {items.map(item => {
                        const available = getAvailableStock(item.id);
                        const isLowStock = !item.is_digital && available < 5;
                        
                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-lg bg-muted/50 flex items-center justify-between ${
                              !item.is_active ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{item.emoji}</span>
                              <div>
                                <div className="font-medium text-foreground">
                                  {item.name}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="font-semibold text-primary">
                                    {item.point_cost} pts
                                  </span>
                                  {item.is_digital ? (
                                    <Badge variant="outline" className="text-xs">Unlimited</Badge>
                                  ) : (
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${isLowStock ? 'border-orange-500 text-orange-500' : ''}`}
                                    >
                                      Stock: {available}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateItem(item.id, { is_active: !item.is_active })}
                                title={item.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {item.is_active ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <X className="w-4 h-4 text-red-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteItem(item.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <ScrollArea className="h-[350px]">
                {orders.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map(order => {
                      const student = getStudent(order.student_id);
                      const orderItemsList = getOrderItems(order.id);

                      return (
                        <div
                          key={order.id}
                          className={`p-3 rounded-lg bg-muted/50 border ${
                            order.status === 'pending' ? 'border-primary' : 'border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{student?.avatar_emoji || '👤'}</span>
                              <div>
                                <div className="font-medium text-foreground text-sm">
                                  {student?.name || 'Unknown'}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {student?.student_number}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={order.status === 'fulfilled' ? 'default' : 'outline'}
                                className={
                                  order.status === 'pending' ? 'border-primary text-primary' :
                                  order.status === 'approved' ? 'border-blue-500 text-blue-500' :
                                  order.status === 'fulfilled' ? 'bg-green-600' :
                                  order.status === 'cancelled' ? 'border-red-500 text-red-500' : ''
                                }
                              >
                                {order.status}
                              </Badge>
                              <div className="text-xs text-muted-foreground mt-1">
                                {order.total_points} pts
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-2">
                            {orderItemsList.map(oi => {
                              const item = getItemDetails(oi.item_id);
                              return (
                                <Badge key={oi.id} variant="secondary" className="text-xs">
                                  {item?.emoji} {item?.name} {oi.quantity > 1 && `x${oi.quantity}`}
                                </Badge>
                              );
                            })}
                          </div>

                          {order.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'approved')}
                                className="flex-1 text-xs"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                className="text-xs text-destructive"
                              >
                                Cancel
                              </Button>
                            </div>
                          )}

                          {order.status === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'fulfilled')}
                              className="w-full text-xs bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Mark Delivered
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Fulfillment Tab */}
            <TabsContent value="fulfillment">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-foreground">Ready to Fulfill</h3>
                    <p className="text-sm text-muted-foreground">
                      {approvedOrders.length} orders ready for delivery
                    </p>
                  </div>
                  <Button variant="outline" disabled={approvedOrders.length === 0}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print List
                  </Button>
                </div>

                {approvedOrders.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No orders ready for fulfillment</p>
                    <p className="text-sm">Approve pending orders first</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[280px]">
                    <div className="space-y-2">
                      {approvedOrders.map(order => {
                        const student = getStudent(order.student_id);
                        const orderItemsList = getOrderItems(order.id);

                        return (
                          <div
                            key={order.id}
                            className="p-3 rounded-lg bg-muted/50 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{student?.avatar_emoji}</span>
                              <div>
                                <div className="font-mono text-sm font-bold">
                                  {student?.student_number}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {orderItemsList.map(oi => {
                                    const item = getItemDetails(oi.item_id);
                                    return `${item?.emoji} ${item?.name}`;
                                  }).join(', ')}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'fulfilled')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Store Item</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input
                placeholder="Candy Bar"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label>Emoji</Label>
              <div className="flex flex-wrap gap-2">
                {ITEM_EMOJIS.map(emoji => (
                  <Button
                    key={emoji}
                    variant={newItemEmoji === emoji ? "default" : "outline"}
                    size="icon"
                    onClick={() => setNewItemEmoji(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Point Cost</Label>
              <Input
                type="number"
                min={1}
                value={newItemCost}
                onChange={(e) => setNewItemCost(parseInt(e.target.value) || 1)}
                className="bg-input border-border text-foreground"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Digital/Unlimited Item</Label>
              <Switch
                checked={newItemDigital}
                onCheckedChange={setNewItemDigital}
              />
            </div>

            {!newItemDigital && (
              <div className="space-y-2">
                <Label>Stock Quantity</Label>
                <Input
                  type="number"
                  min={0}
                  value={newItemStock}
                  onChange={(e) => setNewItemStock(parseInt(e.target.value) || 0)}
                  className="bg-input border-border text-foreground"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="A delicious chocolate bar"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItem(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateItem} disabled={!newItemName.trim()}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolStoreManager;

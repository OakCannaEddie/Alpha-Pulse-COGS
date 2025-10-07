/**
 * Add Inventory Item Dialog Component
 * 
 * Form dialog for creating new inventory items (raw materials or finished goods).
 * Features:
 * - Type selection (raw material vs finished good)
 * - Basic item details with validation
 * - Optional initial stock entry
 * - Category and cost tracking
 * 
 * @component AddInventoryItemDialog
 */

'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useCreateInventoryItem } from '@/hooks/use-inventory-mutations'
import {
  createInventoryItemSchema,
  CreateInventoryItemFormData,
  COMMON_UNITS,
} from '@/lib/validations/inventory'
import { Loader2 } from 'lucide-react'

interface AddInventoryItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: 'raw_material' | 'finished_good'
}

export function AddInventoryItemDialog({
  open,
  onOpenChange,
  defaultType = 'raw_material',
}: AddInventoryItemDialogProps) {
  const { toast } = useToast()
  const createItem = useCreateInventoryItem()
  const [showInitialStock, setShowInitialStock] = useState(false)

  const form = useForm<CreateInventoryItemFormData>({
    resolver: zodResolver(createInventoryItemSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      item_type: defaultType,
      category: '',
      unit: '',
      reorder_point: undefined,
      unit_cost: undefined,
      status: 'active',
      initial_stock: undefined,
      initial_notes: '',
    },
  })

  const onSubmit = async (data: CreateInventoryItemFormData) => {
    try {
      // Transform null values to undefined to match TypeScript types
      const cleanedData = {
        ...data,
        description: data.description || undefined,
        category: data.category || undefined,
        reorder_point: data.reorder_point ?? undefined,
        unit_cost: data.unit_cost ?? undefined,
        initial_stock: data.initial_stock ?? undefined,
        initial_notes: data.initial_notes || undefined,
      }
      
      await createItem.mutateAsync(cleanedData)
      
      toast({
        title: 'Item created',
        description: `${data.name} has been added to your inventory.`,
      })
      
      form.reset()
      onOpenChange(false)
      setShowInitialStock(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create item',
        variant: 'destructive',
      })
    }
  }

  const handleClose = () => {
    form.reset()
    setShowInitialStock(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
          <DialogDescription>
            Create a new raw material or finished good item.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Item Type */}
            <FormField
              control={form.control}
              name="item_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="raw_material">Raw Material</SelectItem>
                      <SelectItem value="finished_good">Finished Good</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Raw materials are consumed in production. Finished goods are produced items.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* SKU */}
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="RM-001 or FG-001" 
                        {...field} 
                        className="font-mono"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>
                      Unique identifier (uppercase letters, numbers, hyphens)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Ingredients, Packaging" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional grouping for filtering
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Sugar - White Granulated" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional details about this item..." 
                      {...field} 
                      value={field.value || ''}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              {/* Unit */}
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMMON_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unit Cost */}
              <FormField
                control={form.control}
                name="unit_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Cost</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        placeholder="0.00" 
                        {...field} 
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reorder Point */}
              <FormField
                control={form.control}
                name="reorder_point"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Point</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        placeholder="100" 
                        {...field} 
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Initial Stock Toggle */}
            <div className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowInitialStock(!showInitialStock)}
              >
                {showInitialStock ? 'Remove' : 'Add'} Initial Stock
              </Button>
            </div>

            {/* Initial Stock Fields */}
            {showInitialStock && (
              <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="initial_stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            placeholder="0" 
                            {...field} 
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="initial_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Initial stock entry" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createItem.isPending}>
                {createItem.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

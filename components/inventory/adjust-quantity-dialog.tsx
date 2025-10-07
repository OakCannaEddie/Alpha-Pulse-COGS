/**
 * Adjust Quantity Dialog Component
 * 
 * Form dialog for adjusting inventory quantities with full audit trail.
 * Supports various transaction types:
 * - Physical count adjustments
 * - Waste/spoilage recording
 * - Manual corrections
 * 
 * @component AdjustQuantityDialog
 */

'use client'

import React, { useEffect } from 'react'
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
import { useCreateInventoryAdjustment } from '@/hooks/use-inventory-mutations'
import {
  createAdjustmentSchema,
  CreateAdjustmentFormData,
  TRANSACTION_TYPE_LABELS,
} from '@/lib/validations/inventory'
import { InventoryItem } from '@/types/inventory.types'
import { Loader2, Plus, Minus, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AdjustQuantityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem | null
}

export function AdjustQuantityDialog({
  open,
  onOpenChange,
  item,
}: AdjustQuantityDialogProps) {
  const { toast } = useToast()
  const createAdjustment = useCreateInventoryAdjustment()

  const form = useForm<CreateAdjustmentFormData>({
    resolver: zodResolver(createAdjustmentSchema),
    defaultValues: {
      transaction_type: 'adjustment_count',
      quantity: 0,
      unit_cost: undefined,
      notes: '',
      lot_number: '',
      transaction_date: new Date().toISOString().split('T')[0],
    },
  })

  const watchedQuantity = form.watch('quantity')
  // Transaction type watching for future validation enhancements
  // const watchedTransactionType = form.watch('transaction_type')

  // Reset form when item changes
  useEffect(() => {
    if (item && open) {
      form.reset({
        transaction_type: 'adjustment_count',
        quantity: 0,
        unit_cost: item.unit_cost || undefined,
        notes: '',
        lot_number: '',
        transaction_date: new Date().toISOString().split('T')[0],
      })
    }
  }, [item, open, form])

  const onSubmit = async (data: CreateAdjustmentFormData) => {
    if (!item) return

    try {
      // Transform null values to undefined to match TypeScript types
      const cleanedData = {
        item_id: item.id,
        quantity: data.quantity,
        transaction_type: data.transaction_type,
        notes: data.notes || undefined,
        unit_cost: data.unit_cost ?? undefined,
        lot_number: data.lot_number || undefined,
        transaction_date: data.transaction_date || undefined,
      }
      
      await createAdjustment.mutateAsync(cleanedData)
      
      toast({
        title: 'Adjustment recorded',
        description: `${item.name} quantity has been updated.`,
      })
      
      form.reset()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record adjustment',
        variant: 'destructive',
      })
    }
  }

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const setQuickAdjust = (amount: number) => {
    form.setValue('quantity', amount)
  }

  if (!item) return null

  const newStock = item.current_stock + watchedQuantity
  const isNegativeResult = newStock < 0

  const adjustmentTypes = [
    'adjustment_count',
    'adjustment_waste',
    'adjustment_other',
  ]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adjust Inventory Quantity</DialogTitle>
          <DialogDescription>
            Record a quantity adjustment for {item.name}
          </DialogDescription>
        </DialogHeader>

        {/* Current Stock Display */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Stock</p>
              <p className="text-2xl font-bold">
                {item.current_stock.toLocaleString()} {item.unit}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">SKU</p>
              <p className="text-lg font-mono">{item.sku}</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Adjustment Type */}
            <FormField
              control={form.control}
              name="transaction_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select adjustment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {adjustmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {TRANSACTION_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the reason for this adjustment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity Adjustment */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Change *</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                          className="text-lg font-semibold"
                        />
                      </FormControl>
                      <span className="flex items-center text-gray-600">{item.unit}</span>
                    </div>
                    
                    {/* Quick Adjustment Buttons */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickAdjust(-10)}
                      >
                        <Minus className="h-3 w-3 mr-1" />
                        10
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickAdjust(-1)}
                      >
                        <Minus className="h-3 w-3 mr-1" />
                        1
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickAdjust(1)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        1
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickAdjust(10)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        10
                      </Button>
                    </div>
                  </div>
                  <FormDescription>
                    Positive numbers increase stock, negative numbers decrease stock
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New Stock Calculation */}
            {watchedQuantity !== 0 && (
              <Alert variant={isNegativeResult ? 'destructive' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  New stock level: <strong>{newStock.toLocaleString()} {item.unit}</strong>
                  {isNegativeResult && (
                    <span className="block mt-1 text-red-600 font-semibold">
                      Warning: This will result in negative inventory!
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
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
                    <FormDescription>
                      Optional - for valuation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Lot Number */}
              {item.item_type === 'raw_material' && (
                <FormField
                  control={form.control}
                  name="lot_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="LOT-12345" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        For traceability
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Reason for adjustment..." 
                      {...field} 
                      value={field.value || ''}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Required for audit trail - explain why this adjustment was made
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createAdjustment.isPending || watchedQuantity === 0}
              >
                {createAdjustment.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Record Adjustment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

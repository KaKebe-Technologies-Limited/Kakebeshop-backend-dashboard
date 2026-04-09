import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createOrder } from '@/api/orders'
import { ntfyService } from '@/services/ntfyService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Minus, Save } from 'lucide-react'

const schema = z.object({
  buyer: z.string().min(1, 'Buyer is required'),
  merchant: z.string().min(1, 'Merchant is required'),
  notes: z.string().optional(),
  delivery_fee: z.string().optional(),
  expected_delivery_date: z.string().optional(),
  items: z.array(z.object({
    listing: z.string().min(1, 'Listing is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unit_price: z.string().min(1, 'Unit price is required'),
  })).min(1, 'At least one item is required'),
})

type FormData = z.infer<typeof schema>

interface OrderCreationFormProps {
  onSuccess?: () => void
}

export default function OrderCreationForm({ onSuccess }: OrderCreationFormProps) {
  const [items, setItems] = useState([{ listing: '', quantity: 1, unit_price: '' }])
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      items: [{ listing: '', quantity: 1, unit_price: '' }]
    }
  })

  const addItem = () => {
    setItems([...items, { listing: '', quantity: 1, unit_price: '' }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        items: items.map(item => ({
          listing: item.listing,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      }
      
      await createOrder(payload)
      
      // Send ntfy notification
      ntfyService.notifyOrderPlaced('MANUAL_ORDER', payload.items.reduce((sum, item) => sum + (parseFloat(item.unit_price) * item.quantity), 0).toString(), data.buyer)
      
      reset()
      setItems([{ listing: '', quantity: 1, unit_price: '' }])
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create order:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="buyer">Buyer ID</Label>
          <Input
            id="buyer"
            placeholder="Enter buyer user ID"
            {...register('buyer')}
          />
          {errors.buyer && <p className="text-red-500 text-sm mt-1">{errors.buyer.message}</p>}
        </div>
        <div>
          <Label htmlFor="merchant">Merchant ID</Label>
          <Input
            id="merchant"
            placeholder="Enter merchant ID"
            {...register('merchant')}
          />
          {errors.merchant && <p className="text-red-500 text-sm mt-1">{errors.merchant.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Order notes..."
          {...register('notes')}
        />
      </div>

      <div>
        <Label htmlFor="delivery_fee">Delivery Fee (Optional)</Label>
        <Input
          id="delivery_fee"
          placeholder="0.00"
          {...register('delivery_fee')}
        />
      </div>

      <div>
        <Label htmlFor="expected_delivery_date">Expected Delivery Date (Optional)</Label>
        <Input
          id="expected_delivery_date"
          type="date"
          {...register('expected_delivery_date')}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>Order Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`listing-${index}`}>Listing ID</Label>
                  <Input
                    id={`listing-${index}`}
                    placeholder="Enter listing ID"
                    value={item.listing}
                    onChange={(e) => updateItem(index, 'listing', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor={`unit_price-${index}`}>Unit Price</Label>
                  <Input
                    id={`unit_price-${index}`}
                    placeholder="0.00"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                  />
                </div>
              </div>
              {items.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeItem(index)}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Remove Item
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full">
        <Save className="h-4 w-4 mr-2" />
        Create Order
      </Button>
    </form>
  )
}

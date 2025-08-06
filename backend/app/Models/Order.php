<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'shipping_address_id',
        'courier_id',
        'payment_method_id',
        'order_type',
        'invoice_number',
        'total_price',
        'order_status',
        'payment_status',
        'paid_at',
        'finished_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shippingAddress()
    {
        return $this->belongsTo(ShippingAddress::class);
    }

    public function courier()
    {
        return $this->belongsTo(Courier::class);
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function orderNotes()
    {
        return $this->hasMany(OrderNote::class);
    }

    public function orderDelivery()
    {
        return $this->hasOne(OrderDelivery::class);
    }

    public function paymentConfirmation()
    {
        return $this->hasOne(PaymentConfirmation::class);
    }

    public function customPCOrder()
    {
        return $this->hasOne(CustomPCOrder::class);
    }

}


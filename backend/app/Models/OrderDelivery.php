<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderDelivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'pickup_method',
        'shipping_cost',
        'tracking_number',
        'delivery_image',
        'estimated_arrival',
        'notes',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}


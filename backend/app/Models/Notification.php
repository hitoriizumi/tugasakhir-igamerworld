<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'order_id',
        'message',
        'link_to',
        'is_read',
    ];

    // Relasi ke user penerima notifikasi
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relasi ke pesanan (order)
    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}


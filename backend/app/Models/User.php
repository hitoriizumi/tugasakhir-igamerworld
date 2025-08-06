<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Notifications\ResetPassword;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * Kolom yang boleh diisi secara mass-assignment
     */
    protected $fillable = [
        'role_id',
        'name',
        'username',
        'email',
        'phone',
        'password',
    ];

    /**
     * Kolom yang disembunyikan dari response JSON
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Casting data otomatis
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function sendPasswordResetNotification($token)
    {
        $url = 'http://localhost:5173/customer/auth/reset-password?token=' . $token;

        $this->notify(new ResetPassword($token, $url));
    }

    public function isSuperadmin()
    {
        return $this->role_id === 1;
    }

    public function isAdmin()
    {
        return $this->role_id === 2;
    }

    public function isCustomer()
    {
        return $this->role_id === 3;
    }

    public function stockEntries()
    {
        return $this->hasMany(StockEntry::class);
    }

    public function carts()
    {
        return $this->hasMany(Cart::class);
    }

    public function wishlists()
    {
        return $this->hasMany(Wishlist::class);
    }

    public function shippingAddresses()
    {
        return $this->hasMany(ShippingAddress::class);
    }

    public function primaryAddress()
    {
        return $this->hasOne(ShippingAddress::class)->where('is_primary', true);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function orderNotes()
    {
        return $this->hasMany(OrderNote::class);
    }

    public function paymentConfirmations()
    {
        return $this->hasMany(PaymentConfirmation::class);
    }

}

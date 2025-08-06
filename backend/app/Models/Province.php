<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    protected $fillable = ['id', 'name'];
    public $incrementing = false; // karena ID dari JSON
    protected $keyType = 'int';

    public function cities()
    {
        return $this->hasMany(City::class);
    }
}


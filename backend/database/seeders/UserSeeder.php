<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
        'role_id'  => 1,
        'name'     => 'Superadmin',
        'username' => 'superadmin',
        'email'    => 'superadmin@igamerworld.test',
        'phone'    => '081234567890',
        'password' => Hash::make('Superadmin123'),
    ]);
    }
}

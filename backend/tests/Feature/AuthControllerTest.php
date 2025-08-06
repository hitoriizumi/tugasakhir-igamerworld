<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use App\Models\User;

class AuthControllerTest extends TestCase
{
    use DatabaseTransactions;

    public function test_register_customer_successfully()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Juna Customer',
            'username' => 'junauser',
            'email' => 'juna@example.com',
            'password' => 'Password@123',
            'phone' => '08123456789',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['message', 'user']);
        
        $this->assertDatabaseHas('users', [
            'email' => 'juna@example.com',
            'role_id' => 3,
        ]);
    }

    public function test_register_with_invalid_password()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Juna',
            'username' => 'invalidpass',
            'email' => 'invalid@example.com',
            'password' => 'abc123', // kurang huruf besar & simbol
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('password');
    }

    public function test_register_with_existing_email()
    {
        User::factory()->create([
            'email' => 'duplicate@example.com',
            'username' => 'existinguser',
            'role_id' => 3,
        ]);

        $response = $this->postJson('/api/register', [
            'name' => 'Juna',
            'username' => 'duplicateuser',
            'email' => 'duplicate@example.com',
            'password' => 'Password@123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('email');
    }

    public function test_login_with_valid_credentials()
    {
        User::factory()->create([
            'email' => 'juna@example.com',
            'username' => 'junauser',
            'password' => Hash::make('Password@123'),
            'role_id' => 3,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'juna@example.com',
            'password' => 'Password@123',
            'expected_role' => 3,
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'message',
                     'access_token',
                     'token_type',
                     'role_id',
                     'name',
                     'email',
                     'username'
                 ]);
    }

    public function test_login_with_wrong_password()
    {
        User::factory()->create([
            'email' => 'juna@example.com',
            'username' => 'junauser',
            'password' => Hash::make('Password@123'),
            'role_id' => 3,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'juna@example.com',
            'password' => 'WrongPass1!',
            'expected_role' => 3,
        ]);

        $response->assertStatus(401)
                 ->assertJson(['message' => 'Email atau password salah']);
    }

    public function test_login_with_wrong_role()
    {
        User::factory()->create([
            'email' => 'juna@example.com',
            'username' => 'junauser',
            'password' => Hash::make('Password@123'),
            'role_id' => 3,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'juna@example.com',
            'password' => 'Password@123',
            'expected_role' => 1, // salah role
        ]);

        $response->assertStatus(403)
                 ->assertJson(['message' => 'Role tidak sesuai untuk akun ini']);
    }

    public function test_logout_successfully()
    {
        $user = User::factory()->create([
            'username' => 'logoutuser',
            'role_id' => 3,
        ]);

        $token = $user->createToken('auth_token_role_3')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                         ->postJson('/api/logout');

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Logout berhasil']);
    }
}

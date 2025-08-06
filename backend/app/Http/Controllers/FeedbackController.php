<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Feedback;
use Illuminate\Support\Facades\Auth;

class FeedbackController extends Controller
{
    private function authorizeCustomer()
    {
        $user = auth()->user();
        if (!$user || $user->role_id !== 3) {
            abort(403, 'Hanya pelanggan yang dapat mengakses fitur ini.');
        }
    }

    private function authorizeAdminOrSuperadmin()
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role_id, [1, 2])) {
            abort(403, 'Hanya admin atau superadmin yang dapat mengakses fitur ini.');
        }
    }

    public function store(Request $request)
    {
        $this->authorizeCustomer();

        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
            'rating' => 'required|integer|min:1|max:5',
        ]);

        $feedback = Feedback::create([
            'user_id' => auth()->id(),
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'rating' => $validated['rating'],
        ]);

        return response()->json(['message' => 'Feedback berhasil dikirim', 'data' => $feedback], 201);
    }

    public function index(Request $request)
    {
        $this->authorizeAdminOrSuperadmin();

        // Ambil parameter ?per_page=10 dari query string (default 10)
        $perPage = $request->query('per_page', 10);

        $feedbacks = Feedback::with('user')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($feedbacks);
    }

    public function show($id)
    {
        $this->authorizeAdminOrSuperadmin();

        $feedback = Feedback::with('user')->findOrFail($id);
        return response()->json(['data' => $feedback]);
    }
}

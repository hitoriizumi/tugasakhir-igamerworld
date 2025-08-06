<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPassword extends Notification
{
    public $token;
    public $url;

    public function __construct($token, $url = null)
    {
        $this->token = $token;
        $this->url = $url ?: url(route('password.reset', ['token' => $token], false));
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Reset Password')
            ->line('Klik link berikut untuk mengatur ulang password Anda:')
            ->action('Reset Password', $this->url)
            ->line('Jika Anda tidak meminta reset, abaikan email ini.');
    }
}

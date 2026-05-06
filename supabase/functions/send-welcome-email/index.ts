import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  email: string;
  fullName: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, fullName } = (await req.json()) as SendEmailRequest;

    console.log(`Sending welcome email to ${email}`);

    // Create email content
    const emailContent = {
      to: email,
      subject: "Welcome to Study Buddy! 🎓",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to Study Buddy! 🎓</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Hi ${fullName},
            </p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Your account has been successfully created! You're all set to start your learning journey with Study Buddy.
            </p>
            
            <h2 style="font-size: 20px; color: #333; margin-bottom: 15px;">What you can do:</h2>
            <ul style="font-size: 16px; color: #333; margin-bottom: 20px; line-height: 1.8;">
              <li>✅ Create and organize study sets</li>
              <li>✅ Generate flashcards with AI assistance</li>
              <li>✅ Practice with interactive quizzes</li>
              <li>✅ Track your progress</li>
              <li>✅ Study anywhere, anytime</li>
            </ul>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              If you have any questions or need help getting started, please don't hesitate to contact us through the Help & Support section in the app.
            </p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 30px;">
              Happy studying!<br/>
              <strong>The Study Buddy Team</strong>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              You received this email because you created an account with Study Buddy using this email address.
            </p>
          </div>
        </div>
      `,
    };

    // For now, just log that we would send the email
    // In production, integrate with SendGrid, Resend, or Mailgun
    console.log("Email would be sent with content:", emailContent);

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: "Welcome email processed (email service integration pending)",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

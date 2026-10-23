import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { CheckCircle2, Eye, EyeOff, Loader2, Mail, Send, ShieldCheck } from 'lucide-react';
import { emailSettingsApi, type EmailServiceSettings } from '../../api/emailSettingsApi';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const emailSchema = z.string().trim().email('Enter a valid Gmail address.').refine(
  (value) => /@(gmail\.com|googlemail\.com)$/i.test(value),
  'Use a Gmail address.'
);

type TestResult = { success: boolean; message: string } | null;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: { error?: string; message?: string; detail?: string } } }).response?.data;
    return data?.error || data?.message || data?.detail || fallback;
  }
  return fallback;
};

export const EmailServiceSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<EmailServiceSettings | null>(null);
  const [gmailAddress, setGmailAddress] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<TestResult>(null);
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const isConfigured = settings?.configured ?? false;

  useEffect(() => {
    let isMounted = true;
    emailSettingsApi.getSettings()
      .then((data) => {
        if (!isMounted) return;
        setSettings(data);
        setGmailAddress(data.gmailAddress ?? '');
        setRecipientEmail(data.gmailAddress ?? '');
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setSaveMessage({ success: false, message: getErrorMessage(error, 'Unable to load email service settings.') });
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedEmail = emailSchema.safeParse(gmailAddress);
    if (!parsedEmail.success) {
      setFieldError(parsedEmail.error.issues[0]?.message ?? 'Enter a valid Gmail address.');
      return;
    }
    if (!isConfigured && !appPassword.trim()) {
      setFieldError('Gmail App Password is required for the initial setup.');
      return;
    }

    setIsSaving(true);
    setFieldError(null);
    setSaveMessage(null);
    try {
      const updatedSettings = await emailSettingsApi.saveSettings(parsedEmail.data, appPassword);
      setSettings(updatedSettings);
      setGmailAddress(updatedSettings.gmailAddress ?? '');
      setRecipientEmail((currentRecipient) => currentRecipient || updatedSettings.gmailAddress || '');
      setAppPassword('');
      setTestResult(null);
      setSaveMessage({ success: true, message: 'Email service settings saved successfully.' });
    } catch (error: unknown) {
      setSaveMessage({ success: false, message: getErrorMessage(error, 'Unable to save email service settings.') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!settings?.configured) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await emailSettingsApi.sendTestEmail(recipientEmail);
      setTestResult({ success: true, message: result.message });
    } catch (error: unknown) {
      setTestResult({ success: false, message: getErrorMessage(error, 'Test email failed. Check the Gmail settings and try again.') });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Email Service Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Set up the Gmail account used to send portal verification emails.
        </p>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-blue-600" /> Gmail Account
          </CardTitle>
          <CardDescription>Enter the account that should send emails from the portal.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading settings...
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="gmailAddress">Gmail Address</Label>
                <Input
                  id="gmailAddress"
                  type="email"
                  autoComplete="email"
                  value={gmailAddress}
                  onChange={(event) => setGmailAddress(event.target.value)}
                  placeholder="portal.account@gmail.com"
                  required
                />
                <p className="text-xs text-slate-500">Enter the Gmail account used to send portal emails.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="appPassword">Gmail App Password</Label>
                <div className="relative">
                  <Input
                    id="appPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={appPassword}
                    onChange={(event) => setAppPassword(event.target.value)}
                    placeholder={isConfigured ? 'Leave empty to keep the saved password' : 'Enter your Google App Password'}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide App Password' : 'Show App Password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Enter the Google App Password for this account, not your normal Gmail login password.
                </p>
                {isConfigured && <p className="text-xs text-emerald-600">App Password is already configured</p>}
              </div>

              {fieldError && <p className="text-sm text-rose-600" role="alert">{fieldError}</p>}
              {saveMessage && (
                <p className={`text-sm ${saveMessage.success ? 'text-emerald-600' : 'text-rose-600'}`} role="status">
                  {saveMessage.message}
                </p>
              )}

              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Save Settings
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Send className="h-5 w-5 text-indigo-600" /> Send Test Email
          </CardTitle>
          <CardDescription>Confirm that the portal can send email using the saved Gmail account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="recipientEmail">Test recipient email</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(event) => setRecipientEmail(event.target.value)}
                placeholder={settings?.gmailAddress ?? 'Uses the configured Gmail address'}
              />
              <p className="text-xs text-slate-500">Leave empty to send the test email to the configured Gmail address.</p>
            </div>
            <Button type="button" variant="outline" onClick={handleTestEmail} disabled={!settings?.configured || isTesting}>
              {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Test Email
            </Button>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
            <p>
              <span className="font-medium">Email Service:</span>{' '}
              <span className={settings?.configured ? 'text-emerald-600' : 'text-amber-600'}>
                {settings?.configured ? 'Configured' : 'Not Configured'}
              </span>
            </p>
            <p>
              <span className="font-medium">Test Email:</span>{' '}
              <span className={testResult?.success ? 'text-emerald-600' : testResult ? 'text-rose-600' : 'text-slate-500'}>
                {testResult ? (testResult.success ? 'Success' : 'Failed') : 'Not tested'}
              </span>
            </p>
          </div>
          {testResult && (
            <p className={`flex items-start gap-2 text-sm ${testResult.success ? 'text-emerald-600' : 'text-rose-600'}`} role="status">
              {testResult.success && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
              {testResult.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

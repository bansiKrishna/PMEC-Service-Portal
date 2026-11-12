
import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
} from 'lucide-react';

import {
  emailSettingsApi,
  type EmailServiceSettings,
} from '../../api/emailSettingsApi';

import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const emailSchema = z
  .string()
  .trim()
  .email('Enter a valid Gmail address.')
  .refine(
    (value) => /@(gmail\.com|googlemail\.com)$/i.test(value),
    'Use a Gmail address.',
  );

type TestResult = {
  success: boolean;
  message: string;
} | null;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (
      error as {
        response?: {
          data?: {
            error?: string;
            message?: string;
            detail?: string;
          };
        };
      }
    ).response?.data;

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

  // Load existing email settings
  useEffect(() => {
    let isMounted = true;

    emailSettingsApi
      .getSettings()
      .then((data) => {
        if (!isMounted) return;

        setSettings(data);
        setGmailAddress(data.gmailAddress ?? '');
        setRecipientEmail(data.gmailAddress ?? '');
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setSaveMessage({
            success: false,
            message: getErrorMessage(
              error,
              'Unable to load email service settings.',
            ),
          });
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Save email settings
  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const parsedEmail = emailSchema.safeParse(gmailAddress);

    if (!parsedEmail.success) {
      setFieldError(
        parsedEmail.error.issues[0]?.message ??
          'Enter a valid Gmail address.',
      );
      return;
    }

    if (!isConfigured && !appPassword.trim()) {
      setFieldError(
        'Gmail App Password is required for the initial setup.',
      );
      return;
    }

    setIsSaving(true);
    setFieldError(null);
    setSaveMessage(null);

    try {
      const updatedSettings = await emailSettingsApi.saveSettings(
        parsedEmail.data,
        appPassword,
      );

      setSettings(updatedSettings);
      setGmailAddress(updatedSettings.gmailAddress ?? '');

      setRecipientEmail(
        (currentRecipient) =>
          currentRecipient || updatedSettings.gmailAddress || '',
      );

      setAppPassword('');
      setShowPassword(false);
      setTestResult(null);

      setSaveMessage({
        success: true,
        message: 'Email service settings saved successfully.',
      });
    } catch (error: unknown) {
      setSaveMessage({
        success: false,
        message: getErrorMessage(
          error,
          'Unable to save email service settings.',
        ),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Send a test email
  const handleTestEmail = async () => {
    if (!settings?.configured || isTesting) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await emailSettingsApi.sendTestEmail(
        recipientEmail.trim(),
      );

      setTestResult({
        success: true,
        message: result.message,
      });
    } catch (error: unknown) {
      setTestResult({
        success: false,
        message: getErrorMessage(
          error,
          'Test email failed. Check the Gmail settings and try again.',
        ),
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-1 pb-4 text-sm">
      {/* Compact Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
          <Mail className="h-4 w-4" />
        </div>

        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Email Service Settings
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure Gmail for OTP and portal verification emails.
          </p>
        </div>
      </div>

      {/* Gmail Configuration Card */}
      <Card className="overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="space-y-1 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Mail className="h-4 w-4 text-blue-600" />
              Gmail Configuration
            </CardTitle>

            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${
                isConfigured
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
              }`}
            >
              {isConfigured ? 'Configured' : 'Not configured'}
            </span>
          </div>

          <CardDescription className="text-xs">
            Manage the account used to send portal emails.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center gap-2 py-5 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading settings...
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                {/* Gmail Address */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="gmailAddress"
                    className="text-xs font-medium"
                  >
                    Gmail Address
                  </Label>

                  <Input
                    id="gmailAddress"
                    type="email"
                    autoComplete="email"
                    value={gmailAddress}
                    onChange={(event) =>
                      setGmailAddress(event.target.value)
                    }
                    placeholder="portal.account@gmail.com"
                    required
                    className="h-9 text-xs"
                  />

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Gmail account used to send portal emails.
                  </p>
                </div>

                {/* Gmail App Password */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="appPassword"
                    className="text-xs font-medium"
                  >
                    Gmail App Password
                  </Label>

                  <div className="relative">
                    <Input
                      id="appPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={appPassword}
                      onChange={(event) =>
                        setAppPassword(event.target.value)
                      }
                      placeholder={
                        isConfigured
                          ? 'Leave empty to keep saved password'
                          : 'Enter Google App Password'
                      }
                      className="h-9 pr-9 text-xs"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((visible) => !visible)
                      }
                      aria-label={
                        showPassword
                          ? 'Hide App Password'
                          : 'Show App Password'
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Use a Google App Password, not your normal Gmail
                    password.
                  </p>

                  {isConfigured && (
                    <p className="flex items-center gap-1 text-[11px] text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Saved password is configured
                    </p>
                  )}
                </div>
              </div>

              {/* Validation Error */}
              {fieldError && (
                <p
                  className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                  role="alert"
                >
                  {fieldError}
                </p>
              )}

              {/* Save Result */}
              {saveMessage && (
                <p
                  className={`rounded-md px-3 py-2 text-xs ${
                    saveMessage.success
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                  }`}
                  role="status"
                >
                  {saveMessage.message}
                </p>
              )}

              {/* Save Button */}
              <div className="flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="h-8 px-3 text-xs"
                >
                  {isSaving ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  )}

                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Test Email Card */}
      <Card className="overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="space-y-1 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Send className="h-4 w-4 text-indigo-600" />
            Test Email Delivery
          </CardTitle>

          <CardDescription className="text-xs">
            Verify that the configured email service can send messages.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-1.5">
              <Label
                htmlFor="recipientEmail"
                className="text-xs font-medium"
              >
                Recipient Email
              </Label>

              <Input
                id="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(event) =>
                  setRecipientEmail(event.target.value)
                }
                placeholder={
                  settings?.gmailAddress ?? 'Enter recipient email'
                }
                className="h-9 text-xs"
              />

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Leave empty to use the configured Gmail address.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleTestEmail}
              disabled={!settings?.configured || isTesting}
              className="h-9 px-3 text-xs"
            >
              {isTesting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-3.5 w-3.5" />
              )}

              {isTesting ? 'Sending...' : 'Send Test'}
            </Button>
          </div>

          {/* Service Status */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">
                Email Service:
              </span>

              <span
                className={
                  settings?.configured
                    ? 'font-medium text-emerald-600'
                    : 'font-medium text-amber-600'
                }
              >
                {settings?.configured
                  ? 'Configured'
                  : 'Not Configured'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">
                Test Status:
              </span>

              <span
                className={`font-medium ${
                  testResult?.success
                    ? 'text-emerald-600'
                    : testResult
                      ? 'text-rose-600'
                      : 'text-slate-500'
                }`}
              >
                {testResult
                  ? testResult.success
                    ? 'Successful'
                    : 'Failed'
                  : 'Not tested'}
              </span>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
              }`}
              role="status"
            >
              {testResult.success && (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}

              <span>{testResult.message}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

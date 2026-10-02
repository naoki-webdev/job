import { FormEvent, useEffect, useRef, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { t } from "../i18n";
import { requiredInputMessage, scrollToFirstInvalidField } from "../utils/formValidation";
import FormErrorSummary from "./FormErrorSummary";

const viteEnv = (import.meta as {
  env?: { VITE_DEMO_EMAIL?: string; VITE_DEMO_PASSWORD?: string };
}).env;
const DEMO_EMAIL = viteEnv?.VITE_DEMO_EMAIL ?? "demo@example.com";
const DEMO_PASSWORD = viteEnv?.VITE_DEMO_PASSWORD ?? "password";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginPageProps = {
  error: string | null;
  onSubmit: (email: string, password: string) => Promise<boolean>;
};

export default function LoginPage({ error, onSubmit }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [submitAttempt, setSubmitAttempt] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const emailError = getEmailError(email, submitAttempt > 0);
  const passwordError = submitAttempt > 0 && !password ? requiredInputMessage(t("auth.password")) : null;
  const formErrorMessages = [emailError, passwordError].filter((message): message is string => Boolean(message));

  useEffect(() => {
    if (submitAttempt > 0) scrollToFirstInvalidField(formRef.current);
  }, [submitAttempt]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempt((attempt) => attempt + 1);
    if (getEmailError(email, true) || !password) return;
    setSubmitting(true);

    try {
      await onSubmit(email, password);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoSubmitting(true);
    setSubmitAttempt(0);
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);

    try {
      await onSubmit(DEMO_EMAIL, DEMO_PASSWORD);
    } finally {
      setDemoSubmitting(false);
    }
  };

  const disabled = submitting || demoSubmitting;

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "grid", placeItems: "center", py: 4 }}>
      <Paper
        ref={formRef}
        component="form"
        onSubmit={handleSubmit}
        noValidate
        variant="outlined"
        sx={{
          width: "100%",
          p: { xs: 2.5, sm: 4 },
          borderRadius: 2,
          backgroundColor: "rgba(255,255,255,0.98)",
        }}
      >
        <Stack spacing={2.25}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {t("auth.title")}
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          {submitAttempt > 0 && <FormErrorSummary messages={formErrorMessages} />}

          <Stack spacing={1}>
            <Button
              type="button"
              variant="contained"
              size="large"
              color="secondary"
              onClick={handleDemoLogin}
              disabled={disabled}
            >
              {demoSubmitting ? t("auth.signing_in") : t("auth.demo_login")}
            </Button>
          </Stack>

          <Divider>{t("common.or")}</Divider>

          <TextField
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            error={Boolean(emailError)}
            helperText={emailError}
            data-field-error={emailError ? "true" : undefined}
            fullWidth
          />
          <TextField
            label={t("auth.password")}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            error={Boolean(passwordError)}
            helperText={passwordError}
            data-field-error={passwordError ? "true" : undefined}
            fullWidth
          />

          <Button type="submit" variant="outlined" size="large" disabled={disabled}>
            {submitting ? t("auth.signing_in") : t("auth.sign_in")}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}

function getEmailError(email: string, validate: boolean) {
  if (!validate) return null;
  if (!email.trim()) return requiredInputMessage(t("auth.email"));
  if (!EMAIL_PATTERN.test(email.trim())) return t("validation.email_format");
  return null;
}

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { t } from "../i18n";

type FormErrorSummaryProps = {
  messages: string[];
};

export default function FormErrorSummary({ messages }: FormErrorSummaryProps) {
  if (messages.length === 0) return null;

  return (
    <Alert severity="error" role="alert" aria-live="assertive">
      <Typography variant="body2">{t("validation.form_prompt")}</Typography>
      <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.5 }}>
        {messages.map((message, index) => <li key={`${index}-${message}`}>{message}</li>)}
      </Box>
    </Alert>
  );
}

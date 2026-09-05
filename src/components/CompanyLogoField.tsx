import { memo, useEffect, useState } from "react";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { t } from "../i18n";
import CompanyLogoAvatar from "./CompanyLogoAvatar";

type CompanyLogoFieldProps = {
  companyName: string;
  currentLogoUrl?: string | null;
  currentLogoFilename?: string | null;
  logoFile: File | null;
  removeLogo: boolean;
  onLogoChange: (file: File | null) => void;
  onRemoveLogoChange: (remove: boolean) => void;
};

function CompanyLogoField({
  companyName,
  currentLogoUrl,
  currentLogoFilename,
  logoFile,
  removeLogo,
  onLogoChange,
  onRemoveLogoChange,
}: CompanyLogoFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!logoFile || typeof URL === "undefined" || !URL.createObjectURL) {
      setPreviewUrl(null);
      return undefined;
    }

    const nextUrl = URL.createObjectURL(logoFile);
    setPreviewUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [logoFile]);

  const visibleLogoUrl = previewUrl ?? (removeLogo ? null : currentLogoUrl);
  const description = logoFile?.name
    ?? (removeLogo ? t("jobs.form.logo_removed") : currentLogoFilename ?? t("jobs.form.logo_empty"));

  return (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary">
        {t("jobs.form.company_logo")}
      </Typography>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <CompanyLogoAvatar companyName={companyName} logoUrl={visibleLogoUrl} size={56} />
        <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button component="label" variant="outlined" size="small">
              {t("jobs.form.logo_select")}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(event) => {
                  onLogoChange(event.target.files?.[0] ?? null);
                  onRemoveLogoChange(false);
                }}
              />
            </Button>
            {(logoFile || (currentLogoUrl && !removeLogo)) && (
              <Button
                variant="text"
                size="small"
                color="inherit"
                onClick={() => {
                  onLogoChange(null);
                  onRemoveLogoChange(Boolean(currentLogoUrl));
                }}
              >
                {logoFile ? t("jobs.form.logo_clear") : t("jobs.form.logo_remove")}
              </Button>
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary" noWrap title={description}>
            {description}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}

export default memo(CompanyLogoField);

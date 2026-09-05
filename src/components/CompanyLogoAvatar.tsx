import { memo } from "react";

import Avatar from "@mui/material/Avatar";

import { t } from "../i18n";

type CompanyLogoAvatarProps = {
  companyName: string;
  logoUrl?: string | null;
  size?: number;
};

function CompanyLogoAvatar({ companyName, logoUrl, size = 40 }: CompanyLogoAvatarProps) {
  const fallback = companyName.trim().charAt(0) || "-";

  return (
    <Avatar
      alt={t("jobs.logo_alt", { company: companyName || t("jobs.form.company_name") })}
      src={logoUrl ?? undefined}
      variant="rounded"
      sx={{
        width: size,
        height: size,
        bgcolor: "grey.200",
        color: "text.secondary",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {fallback}
    </Avatar>
  );
}

export default memo(CompanyLogoAvatar);

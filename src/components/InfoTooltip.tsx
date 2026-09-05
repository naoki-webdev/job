import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

type InfoTooltipProps = {
  title: string;
  label: string;
};

export default function InfoTooltip({ title, label }: InfoTooltipProps) {
  return (
    <Tooltip arrow title={title}>
      <IconButton
        size="small"
        aria-label={`${label}について`}
        sx={{ p: 0.25, color: "text.secondary", verticalAlign: "middle" }}
      >
        <svg
          aria-hidden="true"
          focusable="false"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M9.8 9.25a2.35 2.35 0 1 1 3.75 1.87c-.93.67-1.55 1.08-1.55 2.28"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="12" cy="16.65" r="0.9" fill="currentColor" />
        </svg>
      </IconButton>
    </Tooltip>
  );
}

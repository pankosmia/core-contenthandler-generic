import { useContext, useState } from "react";
import { DialogContent, DialogContentText, Typography } from "@mui/material";
import { doI18n } from "pankosmia-lib/i18n";
import { i18nContext, PanDialog, PanDialogActions } from "pankosmia-rcl";
import { enqueueSnackbar } from "notistack";
import { saveAs } from "file-saver";

export function ExportBurrito() {
  const { i18nRef } = useContext(i18nContext);

  const [open, setOpen] = useState(true);

  const hash = window.location.hash;

  const query = hash.includes("?") ? hash.split("?")[1] : "";

  const params = new URLSearchParams(query);

  const repoPath = params.get("repoPath");
  const returnTypePage = params.get("returnTypePage");

  const handleClose = () => {
    if (returnTypePage === "dashboard") {
      window.location.href = "/clients/main";
    } else {
      window.location.href = "/clients/content";
    }
  };

  const exportBurrito = async () => {
    try {
      const exportUrl = `/api/burrito/zipped/${repoPath}`;

      const exportResponse = await fetch(exportUrl);

      if (!exportResponse.ok) {
        enqueueSnackbar(
          doI18n(
            "pages:core-contenthandler-generic:could_not_export_burrito",
            i18nRef.current,
          ),
          {
            variant: "error",
          },
        );
        return;
      }

      const blob = await exportResponse.blob();
      const projectName = repoPath?.split("/").pop() || "burrito";
      await saveAs(blob, `${projectName}.zip`);

      enqueueSnackbar(
        doI18n(
          "pages:core-contenthandler-generic:burrito_exported",
          i18nRef.current,
        ),
        {
          variant: "success",
        },
      );

      setOpen(false);

      handleClose();
    } catch (error) {
      console.error("Error exporting Burrito:", error);

      enqueueSnackbar(
        doI18n(
          "pages:core-contenthandler-generic:could_not_export_burrito",
          i18nRef.current,
        ),
        {
          variant: "error",
        },
      );
    }
  };

  return (
    <PanDialog
      titleLabel={doI18n(
        "pages:core-contenthandler-generic:export_burrito",
        i18nRef.current,
      )}
      isOpen={open}
      closeFn={handleClose}
      fullWidth={true}
      size="sm"
    >
      <DialogContent>
        <DialogContentText>
          <Typography variant="h6">
            {repoPath?.split("/").pop() || ""}
          </Typography>

          <Typography>
            {doI18n(
              "pages:core-contenthandler-generic:about_to_export_burrito",
              i18nRef.current,
            )}
          </Typography>
        </DialogContentText>
      </DialogContent>

      <PanDialogActions
        closeOnAction={false}
        actionFn={exportBurrito}
        actionLabel={doI18n(
          "pages:core-contenthandler-generic:do_export",
          i18nRef.current,
        )}
        closeFn={handleClose}
        closeLabel={doI18n(
          "pages:core-contenthandler-generic:cancel",
          i18nRef.current,
        )}
      />
    </PanDialog>
  );
}

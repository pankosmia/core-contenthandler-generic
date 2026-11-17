import { useState, useContext, useEffect, useRef } from "react";
import {
  FormControl,
  FormHelperText,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { postJson, getJson } from "pankosmia-lib/http";
import { doI18n } from "pankosmia-lib/i18n";
import {
  i18nContext,
  debugContext,
  Header,
  PanBasicDialog,
  PanDialogActionsArray,
} from "pankosmia-rcl";
import ErrorDialog from "../deleteBook/ErrorDialog";

export default function DeleteBook() {
  const { enqueueSnackbar } = useSnackbar();
  const { i18nRef } = useContext(i18nContext);
  const { debugRef } = useContext(debugContext);
  const [bookCode, setBookCode] = useState("");
  const [open, setOpen] = useState(true);
  const [repoPath, setRepoPath] = useState([]);
  const [bookCodes, setBookCodes] = useState([]);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [nameProject, setNameProject] = useState("");
  const hash = window.location.hash;

  const query = hash.includes("?") ? hash.split(/[?&]/) : "";
  const repoPathQuery = new URLSearchParams(query[1]);
  const path = repoPathQuery.get("repoPath");
  const typePageQuery = new URLSearchParams(query[2]);
  const typeDelete = typePageQuery.get("type");
  const returnType = typePageQuery.get("returnTypePage");
  const [noBookSelected, setNoBookSelected] = useState(false);
  const confirmationRef = useRef(null);

  const getProjectSummaries = async () => {
    setRepoPath(path);
    const summariesResponse = await getJson(
      `/api/burrito/metadata/summary/${path}`,
      debugContext.current,
    );
    if (summariesResponse.ok) {
      const data = summariesResponse.json;
      const bookCode = data.book_codes;
      setNameProject(data.name);
      setBookCodes(bookCode);
    } else {
      console.error(
        `${doI18n("pages:core-contenthandler-generic:error_data", i18nRef.current)}`,
      );
    }
  };

  useEffect(() => {
    getProjectSummaries();
  }, []);

  useEffect(() => {
    const doFetch = async () => {
      setBookCode("");
    };
    if (open) {
      doFetch().then();
    }
  }, [open]);

  const handleClose = () => {
    if (returnType === "dashboard") {
      window.location.href = "/clients/main";
    } else {
      window.location.href = "/clients/content";
    }
  };

  const handleCloseCreate = async () => {
    await postJson(`/api/burrito/metadata/remake-ingredients/${repoPath}`);
    setOpen(false);
    setTimeout(() => {
      window.location.href = "/clients/content";
    }, 500);
  };

  const handleDelete = async () => {
    if (!bookCode) {
      setNoBookSelected(true);
      confirmationRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }
    const deleteResponse = await postJson(
      `/api/burrito/ingredient/delete/${repoPath}?ipath=${bookCode}.${typeDelete}`,
      debugRef.current,
    );
    if (deleteResponse.ok) {
      enqueueSnackbar(
        `${doI18n("pages:core-contenthandler-generic:book_deleted", i18nRef.current)}`,
        {
          variant: "success",
        },
      );
      handleCloseCreate();
    } else {
      setErrorMessage(
        `${doI18n("pages:core-contenthandler-generic:book_delete_error", i18nRef.current)}: ${
          deleteResponse.status
        }`,
      );
      setErrorDialogOpen(true);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -1,
          backgroundImage:
            'url("/api/app-resources/pages/content/background_blur.png")',
          backgroundRepeat: "no-repeat",
          backdropFilter: "blur(3px)",
        }}
      />
      <Header titleKey={""} currentId="" requireNet={false} />
      <PanBasicDialog
        titleLabel={`${doI18n("pages:core-contenthandler-generic:delete_book", i18nRef.current)}`}
        isOpen={open}
        closeFn={() => handleClose()}
        actionsButtonArray={PanDialogActionsArray({
          actionLabel: doI18n(
            "pages:core-contenthandler-generic:delete",
            i18nRef.current,
          ),
          closeFn: () => handleClose(),
          closeLabel: doI18n(
            "pages:core-contenthandler-generic:cancel",
            i18nRef.current,
          ),
          closeOnAction: false,
          actionFn: handleDelete,
        })}
        dividers={true}
      >
        <Typography
          ref={confirmationRef}
          color={noBookSelected && "error"}
          variant="body1"
        >
          {noBookSelected
            ? doI18n(
                "pages:core-contenthandler-generic:delete_book_confirmation",
                i18nRef.current,
              ).replace("{document_name}", nameProject)
            : doI18n(
                "pages:core-contenthandler-generic:delete_book_confirmation",
                i18nRef.current,
              ).replace("{document_name}", nameProject)}
        </Typography>
        <FormControl component="fieldset" error={noBookSelected}>
          <RadioGroup
            aria-label="bookCode"
            aria-describedby={noBookSelected ? "bookCode-error" : undefined}
            name="bookCode"
            value={bookCode}
            onChange={(event) => {
              setBookCode(event.target.value);
              setNoBookSelected(false);
            }}
          >
            {bookCodes.map((listItem, n) => (
              <FormControlLabel
                key={n}
                value={listItem}
                control={<Radio />}
                label={`${listItem} - ${doI18n(
                  `scripture:books:${listItem}`,
                  i18nRef.current,
                )}`}
              />
            ))}
          </RadioGroup>
          {noBookSelected && (
            <FormHelperText id="bookCode-error" role="alert">
              {doI18n(
                "pages:core-contenthandler-generic:no_book_selected",
                i18nRef.current,
              )}
            </FormHelperText>
          )}
        </FormControl>
      </PanBasicDialog>
      {/* Error Dialog */}
      <ErrorDialog
        setErrorDialogOpen={setErrorDialogOpen}
        handleClose={handleClose}
        errorDialogOpen={errorDialogOpen}
        errorMessage={errorMessage}
      />
    </Box>
  );
}

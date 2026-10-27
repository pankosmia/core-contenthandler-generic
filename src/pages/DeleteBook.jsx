import { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";

import {
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Box,
  DialogContent,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { postJson, getJson } from "pankosmia-lib/http";
import { doI18n } from "pankosmia-lib/i18n";
import sx from "../deleteBook/Selection.styles";
import ListMenuItem from "../deleteBook/ListMenuItem";
import {
  PanDialog,
  PanDialogActions,
  i18nContext,
  debugContext,
  Header,
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
  const params = new URLSearchParams(window.location.search);
  const repoPathQuery = new URLSearchParams(query[1]);
  const path = repoPathQuery.get("repoPath");
  const typePageQuery = new URLSearchParams(query[2]);
  const typeDelete = typePageQuery.get("type");

  const returnType = typePageQuery.get("returnTypePage");
  const returnTypeDelete = new URLSearchParams(query[3]);
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
      <PanDialog
        titleLabel={`${doI18n("pages:core-contenthandler-generic:delete_book", i18nRef.current)} - ${nameProject}`}
        isOpen={open}
        closeFn={() => handleClose()}
        fullWidth={false}
      >
        <DialogContent>
          <FormControl sx={{ width: "100%" }}>
            <InputLabel
              id="bookCode-label"
              htmlFor="bookCode"
              sx={sx.inputLabel}
            >
              {doI18n(
                "pages:core-contenthandler-generic:book_code",
                i18nRef.current,
              )}
            </InputLabel>
            <Select
              variant="outlined"
              required
              labelId="bookCode-label"
              name="bookCode"
              inputProps={{
                id: "bookCode",
              }}
              value={bookCode}
              label={doI18n(
                "pages:core-contenthandler-generic:book_code",
                i18nRef.current,
              )}
              onChange={(event) => {
                setBookCode(event.target.value);
              }}
              sx={sx.select}
            >
              {bookCodes.map((listItem, n) => (
                <MenuItem key={n} value={listItem} dense>
                  <ListMenuItem
                    listItem={`${listItem} - ${doI18n(
                      `scripture:books:${listItem}`,
                      i18nRef.current,
                    )}`}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <PanDialogActions
          closeFn={() => handleClose()}
          closeLabel={doI18n(
            "pages:core-contenthandler-generic:close",
            i18nRef.current,
          )}
          actionFn={handleDelete}
          closeOnAction={false}
          actionLabel={doI18n(
            "pages:core-contenthandler-generic:delete_button",
            i18nRef.current,
          )}
        />
      </PanDialog>
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

import {
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { getJson, postJson } from "pankosmia-lib/http";
import { doI18n } from "pankosmia-lib/i18n";
import {
  PanAdvancedDialog,
  PanDialogActionsArray,
  PanPillTypography,
  PanLanguagePickerWrapper,
  PanCopyrightWrapper,
  parseCopyright,
  buildCopyrightString,
  i18nContext,
  debugContext,
  Header,
} from "pankosmia-rcl";

import { useContext, useEffect, useState } from "react";

export default function AboutRepo() {
  const { i18nRef } = useContext(i18nContext);
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState("details");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hash = window.location.hash;
  const query = hash.includes("?") ? hash.split("?") : "";
  const repoPathTypePageQuery = new URLSearchParams(query[1]);
  const returnType = repoPathTypePageQuery.get("returnTypePage");
  const path = repoPathTypePageQuery.get("repoPath");
  const [repoData, setRepodata] = useState({});
  const [repoInfo, setRepoInfo] = useState();

  const isReadOnly = !isEditMode;
  const editMode = true;

  /* Details */
  const [details, setDetails] = useState({
    abbreviation: "",
    name: "",
    description: "",
  });

  /* Language picker */
  const [currentLanguage, setCurrentLanguage] = useState({
    language_code: "",
    language_name: "",
    script_direction: "",
  });
  const [languageIsValid, setLanguageIsValid] = useState(false);

  /* Copyright */
  const [copyright, setCopyright] = useState();
  const [optionCopyright, setOptionCopyright] = useState();

  const t = (key) => doI18n(key, i18nRef.current);

  /* Field rules: return an i18n key when invalid, or null when valid */
  const validateAbbreviation = (value) => {
    if (value.trim() === "")
      return "pages:core-contenthandler-generic:required_field";
    // TODO: add the real abbreviation rules here (pattern, length, ...)
    return null;
  };

  const validateName = (value) => {
    if (value.trim() === "")
      return "pages:core-contenthandler-generic:required_field";
    // TODO: add the real name rules here
    return null;
  };

  const abbreviationError = validateAbbreviation(details.abbreviation);
  const nameError = validateName(details.name);

  /* Validity per tab */
  const detailsIsValid = !abbreviationError && !nameError;
  // Free format needs some text, the other options are always valid
  const copyrightIsValid =
    optionCopyright !== "free" || (copyright?.free_text ?? "").trim() !== "";

  const tabIsValid = {
    details: detailsIsValid,
    language: languageIsValid,
    copyright: copyrightIsValid,
  };
  const allIsValid = Object.values(tabIsValid).every(Boolean);

  /* Rows displayed in view mode on the Details tab */
  const detailsRows = [
    {
      label: "pages:core-contenthandler-generic:abbreviation",
      value: details.abbreviation,
    },
    {
      label: "pages:core-contenthandler-generic:repo_name",
      value: details.name,
    },
    {
      label: "pages:core-contenthandler-generic:description",
      value: details.description,
    },
  ];

  const getProjectSummaries = async () => {
    const summariesResponse = await getJson(
      `/api/burrito/metadata/summary/${path}`,
      debugContext.current,
    );
    if (summariesResponse.ok) {
      const data = await summariesResponse.json;
      setRepodata({ ...data, path });
    } else {
      console.error(t("pages:core-contenthandler-generic:error_data"));
    }
  };

  useEffect(() => {
    getProjectSummaries();
  }, []);

  const handleClose = () => {
    setOpen(false);
    if (returnType === "dashboard") {
      setTimeout(() => {
        window.location.href = "/clients/main";
      });
    } else {
      setTimeout(() => {
        window.location.href = "/clients/content";
      });
    }
  };

  // Fill (or reset) every tab from the loaded data
  const initFromRepoData = (data) => {
    setDetails({
      abbreviation: data.abbreviation ?? "",
      name: data.name ?? "",
      description: data.description ?? "",
    });
    setCurrentLanguage({
      language_code: data.language_code ?? "",
      language_name: data.language_name ?? "",
      script_direction: data.script_direction ?? "",
    });
    if (data.copyright !== undefined) {
      const parsed = parseCopyright(data.copyright, { editMode });
      setCopyright(parsed.copyright);
      setOptionCopyright(parsed.optionCopyright);
    }
  };

  useEffect(() => {
    if (repoData) {
      const info = {
        ...repoData,
        nBooks: repoData.book_codes?.length ?? 0,
        source: repoData.path?.startsWith("_local_")
          ? repoData.path?.startsWith("_local_/_sideloaded_")
            ? doI18n(
                "pages:core-contenthandler-generic:local_resource",
                i18nRef.current,
              )
            : doI18n(
                "pages:core-contenthandler-generic:local_project",
                i18nRef.current,
              )
          : null,
      };
      setRepoInfo(info);
      initFromRepoData(repoData);
    }
  }, [repoData]);

  const handleTabChange = (_event, newValue) => {
    // In edit mode, stay on the current tab while its fields are invalid
    if (isEditMode && !tabIsValid[tab]) return;
    setTab(newValue);
  };

  const handleToggleEditMode = () => {
    if (isEditMode) {
      // Leaving edit mode cancels the changes
      initFromRepoData(repoData);
    }
    setIsEditMode((prev) => !prev);
  };

  // Body sent to POST /api/burrito/metadata/edit/<repo_path>
  // copyright is the same string as the preview in PanCopyright
  const buildEditPayload = () => ({
    abbreviation: details.abbreviation.trim(),
    name: details.name.trim(),
    description: details.description,
    language_code: currentLanguage.language_code,
    language_name: currentLanguage.language_name,
    script_direction: currentLanguage.script_direction,
    copyright: copyright
      ? (buildCopyrightString(optionCopyright, copyright) ?? "")
      : "",
  });

  const handleEditAction = async () => {
    if (!allIsValid || isSaving) return;
    setIsSaving(true);
    try {
      const response = await postJson(
        `/api/burrito/metadata/edit/${path}`,
        JSON.stringify(buildEditPayload()),
        debugContext.current,
      );
      if (response.ok) {
        // Reload the saved data (this also resets every tab), then leave edit mode
        await getProjectSummaries();
        setIsEditMode(false);
      } else {
        console.error(
          `${t("pages:core-contenthandler-generic:error_data")}`,
          response,
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
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
      <Header
        titleKey={
          returnType === "dashboard"
            ? "pages:core-dashboard:title"
            : "pages:core-contenthandler-generic:title"
        }
        currentId="content"
        requireNet={false}
      />

      <PanAdvancedDialog
        titleLabel={`${t("pages:core-contenthandler-generic:about_document")} 
        ${
          repoInfo
            ? `${repoInfo.source ? doI18n(repoInfo.source.toLowerCase(), i18nRef.current) : `${repoInfo.path?.split("/")[1]} (${repoInfo.path?.split("/")[0]})`}  - ${repoInfo.name}`
            : repoData.name
        }`}
        isOpen={open}
        closeFn={() => handleClose()}
        actionsButtonArray={PanDialogActionsArray({
          // No action label / action function outside edit mode
          actionLabel: isEditMode
            ? t("pages:core-contenthandler-generic:edit")
            : undefined,
          actionFn: isEditMode ? handleEditAction : undefined,
          isDisabled: isEditMode && (!allIsValid || isSaving),
          closeLabel: t("pages:core-contenthandler-generic:close"),
          closeFn: () => handleClose(),
          closeOnAction: false,
          onlyCloseButton: !isEditMode,
        })}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Tabs value={tab} onChange={handleTabChange}>
            <Tab
              value="details"
              label={t("pages:core-contenthandler-generic:details")}
            />
            <Tab
              value="language"
              label={t("pages:core-contenthandler-generic:language")}
            />
            <Tab
              value="copyright"
              label={t("pages:core-contenthandler-generic:copyright")}
            />
          </Tabs>

          <Button
            size="small"
            variant={isEditMode ? "contained" : "outlined"}
            onClick={handleToggleEditMode}
          >
            {t("pages:core-contenthandler-generic:edit_mode")}
          </Button>
        </Box>

        {/* ---------- DETAILS ---------- */}
        {tab === "details" && repoInfo && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1}>
              {repoInfo.flavor && (
                <PanPillTypography
                  text={t(
                    `flavors:names:${repoInfo.flavor_type}/${repoInfo.flavor}`,
                  )}
                />
              )}
              {repoInfo.generated_date && (
                <PanPillTypography
                  text={`${t("pages:core-contenthandler-generic:dateUdapted")} ${repoInfo.generated_date}`}
                />
              )}
            </Stack>

            {isReadOnly ? (
              /* ----- VIEW MODE ----- */
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "max-content 1fr",
                  alignItems: "center",
                  columnGap: 3,
                  rowGap: 1.5,
                }}
              >
                {detailsRows.map(({ label, value }) => (
                  <Box key={label} sx={{ display: "contents" }}>
                    <Typography variant="h6">{t(label)}</Typography>
                    <Typography
                      sx={{ color: "text.secondary" }}
                      variant="body1"
                    >
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              /* ----- EDIT MODE ----- */
              <>
                <TextField
                  fullWidth
                  required
                  error={!!abbreviationError}
                  helperText={abbreviationError ? t(abbreviationError) : " "}
                  label={t("pages:core-contenthandler-generic:abbreviation")}
                  value={details.abbreviation}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, abbreviation: e.target.value }))
                  }
                />
                <TextField
                  fullWidth
                  required
                  error={!!nameError}
                  helperText={nameError ? t(nameError) : " "}
                  label={t("pages:core-contenthandler-generic:repo_name")}
                  value={details.name}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, name: e.target.value }))
                  }
                />
                <TextField
                  fullWidth
                  label={t("pages:core-contenthandler-generic:description")}
                  value={details.description}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, description: e.target.value }))
                  }
                />
              </>
            )}
          </Stack>
        )}

        {/* ---------- LANGUAGE ---------- */}
        {tab === "language" && repoInfo && (
          <PanLanguagePickerWrapper
            currentLanguage={currentLanguage}
            setCurrentLanguage={setCurrentLanguage}
            setIsValid={setLanguageIsValid}
            readOnly={isReadOnly}
          />
        )}

        {/* ---------- COPYRIGHT ---------- */}
        {tab === "copyright" && repoInfo && (
          <PanCopyrightWrapper
            optionCopyright={optionCopyright}
            setOptionCopyright={setOptionCopyright}
            copyright={copyright}
            setCopyright={setCopyright}
            readOnly={isReadOnly}
            editMode={editMode}
          />
        )}
      </PanAdvancedDialog>
    </Box>
  );
}

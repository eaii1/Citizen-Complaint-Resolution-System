import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { PGRReducers } from "@egovernments/digit-ui-module-ccrs";
import { initLibraries } from "@egovernments/digit-ui-libraries";
// import { paymentConfigs, PaymentLinks, PaymentModule } from "@egovernments/digit-ui-module-common";
import "@egovernments/digit-ui-health-css/example/index.css";
import { Loader } from "@egovernments/digit-ui-components";

import { UICustomizations } from "./UICustomizations";
import { pgrCustomizations, pgrComponents } from "./pgr";
import { initWorkbenchComponents } from "@egovernments/digit-ui-module-workbench";
import { initHRMSComponents } from "@egovernments/digit-ui-module-hrms";

var Digit = window.Digit || {};

// Lazy load DigitUI
const DigitUI = React.lazy(() =>
  import("@egovernments/digit-ui-module-core").then((mod) => ({
    default: mod.DigitUI,
  }))
);
const enabledModules = [
  "Utilities",
  "PGR",
  "Workbench",
  "HRMS",
];

const initTokens = (stateCode) => {
  const userType =
    window.sessionStorage.getItem("userType") ||
    process.env.REACT_APP_USER_TYPE ||
    "CITIZEN";

  const token =
    window.localStorage.getItem("token") ||
    process.env[`REACT_APP_${userType}_TOKEN`];

  /* ================== LOCALE (URL → STORAGE → FALLBACK) ================== */

  const params = new URLSearchParams(window.location.search);
  const localeFromUrl = params.get("locale"); // am_ET | en_ET | null

  const localeFromStorage = localStorage.getItem("Digit.locale");

  const finalLocale = localeFromUrl || localeFromStorage || "en_ET";

  /* ----------------- WRITE ONCE (THIS IS KEY) ----------------- */

  // SessionStorage (Digit reads this first)
  Digit.SessionStorage.set("locale", finalLocale);
  Digit.SessionStorage.set("lang", finalLocale);
  Digit.SessionStorage.set("Citizen.locale", finalLocale);
  Digit.SessionStorage.set("Employee.locale", finalLocale);

  // LocalStorage (for reloads / next visits)
  localStorage.setItem("Digit.locale", finalLocale);
  localStorage.setItem("Citizen.locale", finalLocale);
  localStorage.setItem("Employee.locale", finalLocale);

  /* ================== REST OF YOUR CODE (UNCHANGED) ================== */

  const citizenInfo = localStorage.getItem("Citizen.user-info");
  const citizenTenantId =
    localStorage.getItem("Citizen.tenant-id") || stateCode;

  const employeeInfo = localStorage.getItem("Employee.user-info");
  const employeeTenantId =
    localStorage.getItem("Employee.tenant-id");

  const userTypeInfo =
    userType === "CITIZEN" || userType === "QACT"
      ? "citizen"
      : "employee";

  Digit.SessionStorage.set("user_type", userTypeInfo);
  Digit.SessionStorage.set("userType", userTypeInfo);

  if (userType !== "CITIZEN") {
    Digit.SessionStorage.set("User", {
      access_token: token,
      info: employeeInfo ? JSON.parse(employeeInfo) : null,
    });
  }

  Digit.SessionStorage.set("Citizen.tenantId", citizenTenantId);

  if (employeeTenantId) {
    Digit.SessionStorage.set("Employee.tenantId", employeeTenantId);
  }
};


const initDigitUI = async () => {
  window.contextPath = window?.globalConfigs?.getConfig("CONTEXT_PATH") || "digit-ui";
  window.Digit.Customizations = {
    commonUiConfig: UICustomizations,
    PGR: pgrCustomizations,
  };
  window?.Digit.ComponentRegistryService.setupRegistry({
    ...pgrComponents,
    // PaymentModule,
    // ...paymentConfigs,
    // PaymentLinks,
  });
  // initUtilitiesComponents();
  // initPGRComponents();



  // Dynamically import and register modules after initLibraries
  const [
    { initUtilitiesComponents },
    { initPGRComponents },
    // {initWorkbenchComponents},
    // {initHRMSComponents}
  ] = await Promise.all([
    import("@egovernments/digit-ui-module-utilities"),
    import("@egovernments/digit-ui-module-ccrs"),
    // import("@egovernments/digit-ui-module-workbench"),
    // import("@egovernments/digit-ui-module-hrms"),

  ]);

  // Initialize them in safe order
  initUtilitiesComponents();
  initPGRComponents();
  initWorkbenchComponents();
  initHRMSComponents();




  const moduleReducers = (initData) => ({
    pgr: PGRReducers(initData),
  });
  const stateCode = window?.globalConfigs?.getConfig("STATE_LEVEL_TENANT_ID") || "pb";
  initTokens(stateCode);

  ReactDOM.render(<Suspense fallback={<Loader page={true} variant={"PageLoader"} />}>
    <DigitUI stateCode={stateCode} enabledModules={enabledModules} defaultLanding="employee" moduleReducers={moduleReducers} />
  </Suspense>, document.getElementById("root"));
};

initLibraries().then(() => {
  initDigitUI();
});

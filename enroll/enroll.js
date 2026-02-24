const PLANS = {
  starter: { label: "\u20AC50 Course Package", price: 50 },
  growth: { label: "\u20AC75 Course Package", price: 75 },
  premium: { label: "\u20AC110 Course Package", price: 110 },
};

const VALID_PLAN_KEYS = Object.keys(PLANS);
const DEFAULT_SUBJECT = "DELE A2 REVIEW COURSE";
const SUBJECT_PREFIX = "ApoyoFilipino Enrollment - ";
const EMAIL_FUNCTION_NAME = "send-enrollment-emails";
const STORAGE_BUCKET = "receipts";
const TABLE = "enrollments";

(() => {
  const run = () => {
    const form = document.getElementById("enrollForm");
    if (!form) return;

    const formView = document.getElementById("enrollFormView");
    const thankView = findFirstElement([
      "#thankYouView",
      "#thankYou",
      "#thank-you",
      ".thank-you",
      "[data-thankyou]",
    ]);
    const enrollCard = document.querySelector(".enroll-card");
    const enrollLayout = document.querySelector(".enroll-layout");
    const backHomeBtn = document.getElementById("backHomeBtn");
    const planWarning = document.getElementById("planWarning");
    const formStatus = document.getElementById("formStatus");

    const planField = findFirstElement([
      "#selectedPlan",
      "#plan",
      "#planLabel",
      "select[name='plan']",
      "input[name='plan']",
      "input[name='planLabel']",
    ]);
    const subjectField = findFirstElement(["#subject", "input[name='subject']"]);
    const fullNameField = findFirstElement([
      "#fullName",
      "input[name='fullName']",
      "input[name='full_name']",
      "input[name='name']",
    ]);
    const emailField = findFirstElement(["#email", "input[name='email']", "input[type='email']"]);
    const phoneField = findFirstElement([
      "#phone",
      "#whatsapp",
      "input[name='phone']",
      "input[name='whatsapp']",
      "input[name='mobile']",
    ]);
    const notesField = findFirstElement(["#notes", "textarea[name='notes']"]);
    const receiptField = findFirstElement([
      "#receipt",
      "input[name='receipt']",
      "input[type='file'][name='file']",
      "input[type='file']",
    ]);
    const submitButton = form.querySelector("button[type='submit'], input[type='submit']");

    syncBrandAssets();
    setDefaultViewState(formView, thankView, enrollCard, enrollLayout);
    setBackgroundState("form");

    if (backHomeBtn && backHomeBtn.dataset.boundClick !== "true") {
      backHomeBtn.dataset.boundClick = "true";
      backHomeBtn.addEventListener("click", () => {
        window.location.href = "../index.html";
      });
    }

    const selectedPlan = parsePlanFromQuery();
    console.log("Plan parsed:", selectedPlan);

    if (subjectField) {
      subjectField.value = buildSubject(selectedPlan);
      subjectField.readOnly = true;
      subjectField.setAttribute("aria-readonly", "true");
    }

    if (planField && selectedPlan) {
      setPlanFieldValue(planField, selectedPlan);
    }

    if (!selectedPlan) {
      if (planWarning) {
        planWarning.hidden = false;
      }
      if (planField && "value" in planField) {
        planField.value = "Invalid plan";
      }
      disableFormInputs(form, [planField, subjectField]);
      showUserError("Invalid plan selected. Please return to Pricing and try again.", formStatus);
      return;
    }

    const supabaseClient = initSupabaseClient();

    if (form.dataset.submitBound === "true") return;
    form.dataset.submitBound = "true";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setStatus(formStatus, "", false);

      if (!supabaseClient) {
        showUserError(
          "Enrollment form is not configured correctly right now. Please try again in a moment.",
          formStatus
        );
        return;
      }

      const fullName = readValue(fullNameField);
      const email = readValue(emailField).toLowerCase();
      const phone = readValue(phoneField);
      const notes = readValue(notesField);
      const plan = selectedPlan || normalizePlan(readValue(planField));
      const subject = (readValue(subjectField) || buildSubject(plan)).trim() || DEFAULT_SUBJECT;
      const receipt = receiptField && receiptField.files ? receiptField.files[0] : null;

      if (!isValidEmail(email)) {
        showUserError("Please enter a valid email address.", formStatus);
        return;
      }
      if (!plan || !VALID_PLAN_KEYS.includes(plan)) {
        showUserError("Please open the enrollment page from a valid plan link.", formStatus);
        return;
      }
      if (!receipt) {
        showUserError("Please upload your payment receipt before submitting.", formStatus);
        return;
      }

      setLoading(submitButton, true);

      try {
        const extension = getExtension(receipt.name, receipt.type);
        const safeEmail = toSafeEmail(email);
        const uploadPath = `${plan}/${safeEmail}_${Date.now()}.${extension}`;

        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from(STORAGE_BUCKET)
          .upload(uploadPath, receipt, {
            upsert: false,
            contentType: receipt.type || undefined,
          });

        if (uploadError) throw uploadError;

        const storedPath =
          uploadData && typeof uploadData.path === "string" ? uploadData.path : uploadPath;
        console.log("Upload ok:", storedPath);

        const enrollment_id = crypto.randomUUID();

        const { error: insertError } = await supabaseClient.from(TABLE).insert([
          {
            id: enrollment_id,
            plan,
            price_eur: PLANS[plan] ? PLANS[plan].price : null,
            subject,
            full_name: fullName || null,
            email,
            whatsapp: phone || null,
            notes: notes || null,
            receipt_path: storedPath,
            status: "pending",
            admin_notified: false,
          },
        ]);

        if (insertError) {
          console.error("Insert failed", insertError);
          throw insertError;
        }
        console.log("Insert ok:", enrollment_id);

        try {
          const { data: invokeData, error: invokeError } = await supabaseClient.functions.invoke(
            EMAIL_FUNCTION_NAME,
            {
              body: { enrollment_id, subject },
            }
          );

          if (invokeError) {
            console.warn("Invoke failed", invokeError);
          } else if (
            invokeData &&
            typeof invokeData === "object" &&
            "error" in invokeData &&
            invokeData.error
          ) {
            console.warn("Invoke failed", invokeData.error);
          } else {
            console.log("Invoke ok");
          }
        } catch (invokeException) {
          console.warn("Invoke failed", invokeException);
        }

        showThankYou({ form, formView, thankView, enrollCard, enrollLayout });
      } catch (error) {
        console.error("Enrollment submit failed:", error);
        showUserError(
          "We could not complete your enrollment right now. Please check your details and try again.",
          formStatus
        );
      } finally {
        setLoading(submitButton, false);
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();

function initSupabaseClient() {
  const sdk = window.supabase;
  const env = window.__ENV || {};

  if (!sdk || typeof sdk.createClient !== "function") {
    console.warn("Supabase SDK not loaded.");
    return null;
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.warn("Supabase environment variables are missing.");
    return null;
  }

  try {
    const client = sdk.createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    console.log("Supabase init ok");
    return client;
  } catch (error) {
    console.warn("Supabase init failed", error);
    return null;
  }
}

function parsePlanFromQuery() {
  const rawPlan = new URLSearchParams(window.location.search).get("plan");
  const normalizedPlan = String(rawPlan || "")
    .trim()
    .toLowerCase();

  if (!VALID_PLAN_KEYS.includes(normalizedPlan)) return null;
  return normalizedPlan;
}

function normalizePlan(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (!normalized) return null;
  if (VALID_PLAN_KEYS.includes(normalized)) return normalized;
  if (normalized.includes("starter") || normalized.includes("50")) return "starter";
  if (normalized.includes("growth") || normalized.includes("75")) return "growth";
  if (normalized.includes("premium") || normalized.includes("110")) return "premium";
  return null;
}

function setPlanFieldValue(field, planKey) {
  if (!field || !planKey || !PLANS[planKey]) return;

  if (field.tagName === "SELECT") {
    const options = Array.from(field.options || []);
    let matchedOption = options.find((option) => option.value.toLowerCase() === planKey);

    if (!matchedOption) {
      matchedOption = options.find((option) => normalizePlan(option.textContent) === planKey);
    }

    if (matchedOption) {
      field.value = matchedOption.value;
    } else {
      field.value = planKey;
    }
    field.setAttribute("data-plan-key", planKey);
    field.disabled = true;
    return;
  }

  const inputType = String(field.getAttribute("type") || "").toLowerCase();
  field.value = inputType === "hidden" ? planKey : PLANS[planKey].label;
  field.setAttribute("data-plan-key", planKey);
  field.readOnly = true;
  field.setAttribute("aria-readonly", "true");
}

function buildSubject(planKey) {
  if (!planKey || !VALID_PLAN_KEYS.includes(planKey)) return DEFAULT_SUBJECT;
  return `${SUBJECT_PREFIX}${planKey.toUpperCase()}`;
}

function findFirstElement(selectors) {
  for (let i = 0; i < selectors.length; i += 1) {
    const element = document.querySelector(selectors[i]);
    if (element) return element;
  }
  return null;
}

function readValue(element) {
  if (!element || !("value" in element)) return "";
  return String(element.value || "").trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function toSafeEmail(email) {
  const safe = String(email || "")
    .trim()
    .toLowerCase()
    .replace(/@/g, "_at_")
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);

  return safe || "unknown_email";
}

function getExtension(filename, mimeType) {
  const cleanName = String(filename || "").trim();

  if (cleanName.includes(".")) {
    const ext = cleanName.split(".").pop();
    if (ext) return ext.toLowerCase();
  }

  if (mimeType === "application/pdf") return "pdf";
  if (mimeType && mimeType.startsWith("image/")) {
    const subtype = mimeType.split("/")[1];
    return subtype || "jpg";
  }

  return "bin";
}

function getReceiptUrl(client, bucket, path) {
  if (!client || !bucket || !path) return path;

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  if (data && data.publicUrl) return data.publicUrl;
  return path;
}

function setLoading(button, isLoading) {
  if (!button) return;

  if (!button.dataset.defaultText) {
    button.dataset.defaultText = button.textContent || "Submit Enrollment";
  }

  button.disabled = isLoading;
  button.textContent = isLoading ? "Submitting..." : button.dataset.defaultText;
}

function setStatus(statusNode, message, isError) {
  if (!statusNode) return;
  statusNode.textContent = message;
  statusNode.classList.toggle("is-error", Boolean(isError));
}

function showUserError(message, statusNode) {
  const safeMessage =
    typeof message === "string" && message.trim()
      ? message.trim()
      : "Something went wrong. Please try again.";
  setStatus(statusNode, safeMessage, true);
  window.alert(safeMessage);
}

function disableFormInputs(form, keepEnabled) {
  if (!form) return;

  const keepSet = new Set((keepEnabled || []).filter(Boolean));
  const fields = form.querySelectorAll("input, select, textarea, button");

  fields.forEach((field) => {
    if (keepSet.has(field)) return;
    field.disabled = true;
  });

  form.setAttribute("aria-disabled", "true");
}

function showThankYou(elements) {
  const form = elements && elements.form ? elements.form : null;
  const formView = elements && elements.formView ? elements.formView : null;
  const thankView = elements && elements.thankView ? elements.thankView : null;
  const enrollCard = elements && elements.enrollCard ? elements.enrollCard : null;
  const enrollLayout = elements && elements.enrollLayout ? elements.enrollLayout : null;

  if (formView) {
    hideElement(formView);
  } else if (form) {
    hideElement(form);
  }

  if (thankView) {
    showElement(thankView);
    playFadeSwap(thankView);
  } else {
    window.alert("Thank you for your enrollment. Please check your email for next steps.");
  }

  if (enrollCard) {
    enrollCard.classList.add("is-thankyou-state");
  }
  if (enrollLayout) {
    enrollLayout.classList.add("is-success");
  }
  setBackgroundState("thanks");
}

function setDefaultViewState(formView, thankView, enrollCard, enrollLayout) {
  if (formView) {
    showElement(formView);
    playFadeSwap(formView);
  }
  if (thankView) {
    hideElement(thankView);
  }
  if (enrollCard) {
    enrollCard.classList.remove("is-thankyou-state");
  }
  if (enrollLayout) {
    enrollLayout.classList.remove("is-success");
  }
}

function showElement(element) {
  if (!element) return;
  element.hidden = false;
  element.style.display = "";
  element.classList.remove("view--hidden");
  element.classList.add("view--active");
}

function hideElement(element) {
  if (!element) return;
  element.classList.remove("view--active");
  element.classList.add("view--hidden");
  element.hidden = true;
  element.style.display = "none";
}

function playFadeSwap(element) {
  if (!element) return;
  element.classList.remove("fadeSwap");
  void element.offsetWidth;
  element.classList.add("fadeSwap");
}

function syncBrandAssets() {
  document.querySelectorAll(".brand-logo").forEach((logo) => {
    if (!logo.getAttribute("src")) return;
    logo.setAttribute("src", "/images/logo.png");
    logo.addEventListener(
      "error",
      () => {
        logo.setAttribute("src", "/images/logo.png");
      },
      { once: true }
    );
  });
}

function setBackgroundState(state) {
  document.body.classList.remove("enroll-bg-form", "enroll-bg-thanks");

  if (state === "thanks") {
    document.body.classList.add("enroll-bg-thanks");
    return;
  }

  document.body.classList.add("enroll-bg-form");
}

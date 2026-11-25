
// SHORTCUTS

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];


// MOBILE NAVIGATION

const menuToggle = $("#menuToggle");
const mainNav = $("#mainNav");

menuToggle.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.textContent = open ? "×" : "☰";
});

$$(".nav-link").forEach(link => {
  link.addEventListener("click", () => {

    $$(".nav-link").forEach(item =>
      item.classList.remove("active")
    );

    link.classList.add("active");

    mainNav.classList.remove("open");

    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";

  });
});


// NOTIFICATIONS

function toast(message) {

  const node = $("#toast");

  node.textContent = message;
  node.classList.add("show");

  clearTimeout(toast.timeout);

  toast.timeout = setTimeout(() => {
    node.classList.remove("show");
  }, 3000);

}


// STORAGE

const PET_STORAGE = "pawconnectPets";
const FAVORITE_STORAGE = "pawconnectFavorites";

function readStorage(key, fallback) {

  try {
    const value = localStorage.getItem(key);

    return value ? JSON.parse(value) : fallback;

  } catch (error) {

    console.warn("Unable to read saved information.", error);

    return fallback;

  }

}

function writeStorage(key, value) {

  try {

    localStorage.setItem(key, JSON.stringify(value));

    return true;

  } catch (error) {

    console.warn("Unable to save information.", error);

    return false;

  }

}

function createId() {

  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "pet-" + Date.now() + "-" +
    Math.random().toString(36).slice(2);

}


// ORIGINAL SAMPLE PETS

const samplePets = [

  {
    id: "sample-milo",
    name: "Milo",
    type: "Dog",
    breed: "Aspin mix",
    age: "2 years old",
    status: "Available for adoption",
    description: "A cheerful companion who loves walks, treats, and making new friends.",
    personality: "Cheerful, friendly, and affectionate.",
    likes: "Walks, treats, and meeting new people.",
    photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=700&q=80",
    sample: true
  },

  {
    id: "sample-luna",
    name: "Luna",
    type: "Cat",
    breed: "Domestic shorthair",
    age: "1 year old",
    status: "Available for adoption",
    description: "A gentle, curious kitty who enjoys sunny naps and quiet company.",
    personality: "Gentle and curious.",
    likes: "Sunny naps and quiet company.",
    photo: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=700&q=80",
    sample: true
  },

  {
    id: "sample-buddy",
    name: "Buddy",
    type: "Dog",
    breed: "Mixed breed",
    age: "8 months old",
    status: "Available for adoption",
    description: "Playful, affectionate, and always ready for a little adventure.",
    personality: "Playful and affectionate.",
    likes: "Playtime and adventures.",
    photo: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=700&q=80",
    sample: true
  }

];


// LOAD PREVIOUSLY UPLOADED PETS

let savedPets = readStorage(PET_STORAGE, []);

if (!Array.isArray(savedPets)) {
  savedPets = [];
}

// Give older profiles unique IDs.
// This keeps profiles uploaded using the previous version.

let migrationNeeded = false;

savedPets = savedPets.map(pet => {

  if (!pet.id) {
    migrationNeeded = true;
  }

  return {
    ...pet,
    id: pet.id || createId(),
    status: pet.status || "Available for adoption",
    sample: false
  };

});

if (migrationNeeded) {

  if (!writeStorage(PET_STORAGE, savedPets)) {
    toast("Older profiles loaded, but storage is full.");
  }

}


// FAVORITES

let favoriteList = readStorage(FAVORITE_STORAGE, []);

if (!Array.isArray(favoriteList)) {
  favoriteList = [];
}

let favorites = new Set(favoriteList);

function toggleFavorite(pet) {

  const updatedFavorites = new Set(favorites);

  if (updatedFavorites.has(pet.id)) {
    updatedFavorites.delete(pet.id);
  } else {
    updatedFavorites.add(pet.id);
  }

  if (!writeStorage(FAVORITE_STORAGE, [...updatedFavorites])) {

    toast("Unable to save favorites.");

    return;

  }

  favorites = updatedFavorites;

  renderPets();

  toast(
    favorites.has(pet.id)
      ? `${pet.name} added to favorites!`
      : `${pet.name} removed from favorites.`
  );

}


// SEARCH AND FILTERING

const petGrid = $("#petGrid");
const petSearch = $("#petSearch");

let activeFilter = "All";

petSearch.addEventListener("input", renderPets);

$$(".filter-btn").forEach(button => {

  button.addEventListener("click", () => {

    activeFilter = button.dataset.filter;

    $$(".filter-btn").forEach(item => {

      item.classList.toggle("selected", item === button);

    });

    renderPets();

  });

});


// HELPER FOR CREATING HTML ELEMENTS

function makeElement(tag, className, content) {

  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (content !== undefined) {
    element.textContent = content;
  }

  return element;

}


// AGE CALCULATION

function getPetAge(pet) {

  if (pet.birthday) {

    const birth = new Date(pet.birthday + "T00:00:00");
    const today = new Date();

    if (!isNaN(birth.getTime()) && birth <= today) {

      let months =
        (today.getFullYear() - birth.getFullYear()) * 12 +
        today.getMonth() - birth.getMonth();

      if (today.getDate() < birth.getDate()) {
        months--;
      }

      if (months < 1) {
        return "Less than 1 month old";
      }

      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;

      const parts = [];

      if (years > 0) {
        parts.push(
          years + (years === 1 ? " year" : " years")
        );
      }

      if (remainingMonths > 0) {
        parts.push(
          remainingMonths +
          (remainingMonths === 1 ? " month" : " months")
        );
      }

      return parts.join(", ") + " old";

    }

  }

  return pet.age || "";

}


// CREATE PET CARD

function createPetCard(pet) {

  const card = makeElement("article", "pet-card");

  card.dataset.id = pet.id;

  const image = makeElement("div", "pet-image");

  const img = document.createElement("img");

  img.src = pet.photo;
  img.alt = `Photo of ${pet.name}`;
  img.loading = "lazy";

  const tag = makeElement(
    "span",
    "pet-tag",
    pet.status || "Available for adoption"
  );

  const actions = makeElement("div", "card-actions");

  // FAVORITE BUTTON

  const favorite = makeElement(
    "button",
    "favorite",
    favorites.has(pet.id) ? "♥" : "♡"
  );

  favorite.type = "button";

  favorite.setAttribute(
    "aria-label",
    `Toggle favorite for ${pet.name}`
  );

  favorite.setAttribute(
    "aria-pressed",
    String(favorites.has(pet.id))
  );

  if (favorites.has(pet.id)) {
    favorite.classList.add("saved");
  }

  favorite.addEventListener("click", event => {

    event.stopPropagation();

    toggleFavorite(pet);

  });

  actions.append(favorite);


  // THREE-DOT OPTIONS MENU

  const optionsButton = makeElement(
    "button",
    "options-toggle",
    "⋮"
  );

  optionsButton.type = "button";

  optionsButton.setAttribute(
    "aria-label",
    `Options for ${pet.name}`
  );

  optionsButton.setAttribute("aria-expanded", "false");

  const optionsMenu = makeElement("div", "options-menu");

  optionsMenu.hidden = true;

  const viewButton = makeElement(
    "button",
    "",
    "View profile"
  );

  viewButton.type = "button";

  viewButton.addEventListener("click", event => {

    event.stopPropagation();

    closeAllMenus();

    showPet(pet);

  });

  optionsMenu.append(viewButton);


  // ONLY UPLOADED PETS CAN BE EDITED OR DELETED

  if (!pet.sample) {

    const editButton = makeElement(
      "button",
      "",
      "Edit profile"
    );

    editButton.type = "button";

    editButton.addEventListener("click", event => {

      event.stopPropagation();

      closeAllMenus();

      openEditForm(pet);

    });

    const deleteButton = makeElement(
      "button",
      "delete-option",
      "Delete listing"
    );

    deleteButton.type = "button";

    deleteButton.addEventListener("click", event => {

      event.stopPropagation();

      closeAllMenus();

      deletePet(pet);

    });

    optionsMenu.append(editButton, deleteButton);

  }

  optionsButton.addEventListener("click", event => {

    event.stopPropagation();

    const wasOpen = !optionsMenu.hidden;

    closeAllMenus();

    optionsMenu.hidden = wasOpen;

    optionsButton.setAttribute(
      "aria-expanded",
      String(!wasOpen)
    );

  });

  optionsMenu.addEventListener("click", event => {
    event.stopPropagation();
  });

  actions.append(optionsButton, optionsMenu);

  image.append(img, tag, actions);


  // PET NAME AND BASIC INFORMATION

  const info = makeElement("div", "pet-info");

  const identity = document.createElement("div");

  const name = makeElement("h3", "", pet.name);

  const age = getPetAge(pet);

  const basicInfo = [
    pet.breed,
    age
  ].filter(Boolean).join(" · ");

  const breed = makeElement(
    "p",
    "",
    basicInfo || "More details inside"
  );

  identity.append(name, breed);

  const type = makeElement(
    "span",
    "pet-type",
    (pet.type || "Pet").toUpperCase()
  );

  info.append(identity, type);

  const description = makeElement(
    "p",
    "pet-description",
    pet.description ||
    "A lovely animal looking for a caring home."
  );

  const details = makeElement(
    "button",
    "text-link pet-details",
    `Meet ${pet.name} →`
  );

  details.type = "button";

  details.addEventListener("click", event => {

    event.stopPropagation();

    showPet(pet);

  });


  // CLICK ANYWHERE ON THE CARD TO OPEN PROFILE

  card.addEventListener("click", () => {

    closeAllMenus();

    showPet(pet);

  });

  card.append(image, info, description, details);

  return card;

}


// DISPLAY PETS

function renderPets() {

  closeAllMenus();

  petGrid.replaceChildren();

  const query = petSearch.value.trim().toLowerCase();

  const allPets = [
    ...savedPets.slice().reverse(),
    ...samplePets
  ];

  const filteredPets = allPets.filter(pet => {

    const matchesType =
      activeFilter === "All" ||
      activeFilter === pet.type ||
      (
        activeFilter === "Favorites" &&
        favorites.has(pet.id)
      );

    const searchableText = [
      pet.name,
      pet.breed,
      pet.type,
      pet.age,
      pet.description,
      pet.personality,
      pet.location,
      pet.status
    ].filter(Boolean).join(" ").toLowerCase();

    return matchesType && searchableText.includes(query);

  });

  filteredPets.forEach(pet => {

    petGrid.append(createPetCard(pet));

  });

  $("#emptyState").hidden = filteredPets.length !== 0;

}


// CLOSE OPTIONS MENUS

function closeAllMenus() {

  $$(".options-menu").forEach(menu => {

    menu.hidden = true;

  });

  $$(".options-toggle").forEach(button => {

    button.setAttribute("aria-expanded", "false");

  });

}

document.addEventListener("click", closeAllMenus);

document.addEventListener("keydown", event => {

  if (event.key === "Escape") {

    closeAllMenus();

  }

});


// DELETE A PET PROFILE

function deletePet(pet) {

  if (pet.sample) return;

  const confirmed = confirm(
    `Are you sure you want to delete ${pet.name}'s profile? This cannot be undone.`
  );

  if (!confirmed) return;

  const updatedPets = savedPets.filter(
    item => item.id !== pet.id
  );

  if (!writeStorage(PET_STORAGE, updatedPets)) {

    toast("Unable to delete the profile.");

    return;

  }

  savedPets = updatedPets;

  favorites.delete(pet.id);

  writeStorage(FAVORITE_STORAGE, [...favorites]);

  renderPets();

  toast(`${pet.name}'s profile has been deleted.`);

}


// DIALOGS

const uploadModal = $("#uploadModal");
const petModal = $("#petModal");

$$("[data-close]").forEach(button => {

  button.addEventListener("click", () => {

    button.closest("dialog").close();

  });

});

[uploadModal, petModal].forEach(dialog => {

  dialog.addEventListener("click", event => {

    if (event.target === dialog) {

      const rect = dialog.getBoundingClientRect();

      const outside =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;

      if (outside) dialog.close();

    }

  });

});


// FORMAT DATES

function formatDate(value) {

  if (!value) return "";

  const date = new Date(value + "T00:00:00");

  if (isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

}


// CREATE DETAILED INFORMATION SECTIONS

function createProfileSection(title, fields) {

  const section = makeElement("section", "profile-section");

  const heading = makeElement("h3", "", title);

  const fieldList = makeElement("dl", "profile-fields");

  fields.forEach(field => {

    const [label, value, wide] = field;

    const item = makeElement(
      "div",
      wide ? "profile-field wide" : "profile-field"
    );

    const fieldLabel = makeElement("dt", "", label);

    const fieldValue = makeElement(
      "dd",
      value ? "" : "unknown",
      value || "Not provided"
    );

    item.append(fieldLabel, fieldValue);

    fieldList.append(item);

  });

  section.append(heading, fieldList);

  return section;

}


// SHOW FULL PET PROFILE

let currentProfile = null;

function showPet(pet) {

  currentProfile = pet;

  $("#detailName").textContent = pet.name;

  $("#detailStatus").textContent =
    pet.status || "Available for adoption";

  $("#detailText").textContent =
    pet.description ||
    "Get to know this lovely animal.";

  $("#detailImage").src = pet.photo;

  $("#detailImage").alt = `Photo of ${pet.name}`;

  const information = $("#detailInformation");

  information.replaceChildren();


  // BASIC INFORMATION

  information.append(
    createProfileSection("🐾 Basic information", [

      ["Animal type", pet.type],
      ["Breed", pet.breed],
      ["Sex", pet.sex],
      ["Birthday", formatDate(pet.birthday)],
      ["Age", getPetAge(pet)],
      ["Weight", pet.weight],
      ["Size", pet.size],
      ["Adoption status", pet.status]

    ])
  );


  // BACKGROUND

  information.append(
    createProfileSection("🏡 Background & rescue story", [

      ["Date rescued", formatDate(pet.rescueDate)],
      ["Location found", pet.location],
      ["Current shelter / foster home", pet.shelter, true],
      ["Rescue story", pet.story, true],
      ["Previous ownership", pet.owners, true]

    ])
  );


  // HEALTH

  information.append(
    createProfileSection("🩺 Health & medical information", [

      ["Vaccination status", pet.vaccination],
      ["Spayed / neutered", pet.neutered],
      ["Allergies", pet.allergies, true],
      ["Medical history", pet.medical, true],
      ["Current medications", pet.medication, true],
      ["Dietary requirements", pet.diet, true]

    ])
  );


  // PERSONALITY

  information.append(
    createProfileSection("💚 Personality & lifestyle", [

      ["Personality", pet.personality, true],
      ["Likes", pet.likes],
      ["Dislikes", pet.dislikes],
      ["Good with children", pet.children],
      ["Good with other pets", pet.otherPets],
      ["Energy level", pet.energy],
      ["Training & habits", pet.training, true],
      ["Special needs", pet.needs, true],
      ["Ideal home", pet.home, true]

    ])
  );

  $("#detailAdopt").hidden = pet.status === "Adopted";

  if (!petModal.open) {
    petModal.showModal();
  }

  petModal.scrollTop = 0;

}


// ADOPTION BUTTONS

$("#detailGuide").addEventListener("click", () => {

  petModal.close();

});

$("#detailAdopt").addEventListener("click", () => {

  if (currentProfile) {

    $("#contactInterest").value = "Adopting a pet";

    $("#contactMessage").value =
      `Hello! I am interested in adopting ${currentProfile.name}. I would like to know more about the adoption process.`;

  }

  petModal.close();

});


// FORM FIELD CONNECTIONS

const formFields = {

  name: "newPetName",
  type: "newPetType",
  breed: "newPetBreed",
  sex: "newPetSex",
  birthday: "newPetBirthday",
  age: "newPetAge",
  weight: "newPetWeight",
  size: "newPetSize",
  status: "newPetStatus",
  description: "newPetDescription",

  rescueDate: "newPetRescueDate",
  location: "newPetLocation",
  shelter: "newPetShelter",
  story: "newPetStory",
  owners: "newPetOwners",

  vaccination: "newPetVaccination",
  neutered: "newPetNeutered",
  allergies: "newPetAllergies",
  medical: "newPetMedical",
  medication: "newPetMedication",
  diet: "newPetDiet",

  personality: "newPetPersonality",
  likes: "newPetLikes",
  dislikes: "newPetDislikes",
  children: "newPetChildren",
  otherPets: "newPetOtherPets",
  energy: "newPetEnergy",
  training: "newPetTraining",
  needs: "newPetNeeds",
  home: "newPetHome"

};

let selectedPhoto = null;
let editingPetId = null;
let photoLoading = false;
let photoRequest = 0;


// PHOTO PREVIEW

function updatePhotoPreview(photo) {

  const preview = $("#uploadPreview");

  preview.replaceChildren();

  if (!photo) {

    preview.textContent = "＋";

    return;

  }

  const img = document.createElement("img");

  img.src = photo;
  img.alt = "Selected pet photo";

  preview.append(img);

}


// RESET UPLOAD FORM

function resetUploadForm() {

  photoRequest++;

  $("#uploadForm").reset();

  selectedPhoto = null;
  editingPetId = null;
  photoLoading = false;

  $("#uploadFeedback").textContent = "";

  $("#savePetButton").disabled = false;

  updatePhotoPreview(null);

}


// OPEN NEW PET FORM

$("#openUpload").addEventListener("click", () => {

  resetUploadForm();

  $("#uploadTitle").textContent = "Share a pet profile.";

  $("#savePetButton").textContent = "Add pet profile →";

  uploadModal.showModal();

  uploadModal.scrollTop = 0;

});


// OPEN EDIT FORM

function openEditForm(pet) {

  resetUploadForm();

  editingPetId = pet.id;

  selectedPhoto = pet.photo;

  $("#uploadTitle").textContent =
    `Edit ${pet.name}'s profile`;

  $("#savePetButton").textContent = "Save changes →";

  Object.entries(formFields).forEach(([key, id]) => {

    const field = document.getElementById(id);

    if (pet[key] !== undefined && pet[key] !== null) {

      field.value = pet[key];

    }

  });

  updatePhotoPreview(selectedPhoto);

  uploadModal.showModal();

  uploadModal.scrollTop = 0;

}


// COMPRESS UPLOADED PHOTOS

function compressImage(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onerror = reject;

    reader.onload = () => {

      const image = new Image();

      image.onerror = reject;

      image.onload = () => {

        const maxSize = 1000;

        const scale = Math.min(
          1,
          maxSize / Math.max(image.width, image.height)
        );

        const canvas = document.createElement("canvas");

        canvas.width = Math.max(
          1,
          Math.round(image.width * scale)
        );

        canvas.height = Math.max(
          1,
          Math.round(image.height * scale)
        );

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Image processing unavailable."));
          return;
        }

        context.fillStyle = "#ffffff";

        context.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        context.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height
        );

        resolve(canvas.toDataURL("image/jpeg", 0.8));

      };

      image.src = reader.result;

    };

    reader.readAsDataURL(file);

  });

}


// HANDLE PHOTO UPLOAD

$("#petPhoto").addEventListener("change", async event => {

  const request = ++photoRequest;

  const file = event.target.files[0];

  const feedback = $("#uploadFeedback");

  if (!file) {

    photoLoading = false;

    $("#savePetButton").disabled = false;

    return;

  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {

    feedback.textContent =
      "Please choose a JPG, PNG, or WEBP image.";

    event.target.value = "";

    photoLoading = false;

    $("#savePetButton").disabled = false;

    return;

  }

  if (file.size > 5 * 1024 * 1024) {

    feedback.textContent =
      "Please choose an image smaller than 5 MB.";

    event.target.value = "";

    photoLoading = false;

    $("#savePetButton").disabled = false;

    return;

  }

  photoLoading = true;

  $("#savePetButton").disabled = true;

  feedback.textContent = "Preparing your photo...";

  try {

    const photo = await compressImage(file);

    if (request !== photoRequest) return;

    selectedPhoto = photo;

    updatePhotoPreview(selectedPhoto);

    feedback.textContent = "";

  } catch (error) {

    if (request !== photoRequest) return;

    feedback.textContent =
      "Unable to read this photo. Please try another image.";

    event.target.value = "";

  } finally {

    if (request === photoRequest) {

      photoLoading = false;

      $("#savePetButton").disabled = false;

    }

  }

});


// SAVE NEW OR EDITED PET PROFILE

$("#uploadForm").addEventListener("submit", event => {

  event.preventDefault();

  const feedback = $("#uploadFeedback");

  if (photoLoading) {

    feedback.textContent =
      "Please wait while the photo is being prepared.";

    return;

  }

  if (!selectedPhoto) {

    feedback.textContent =
      "Please upload a photo of the animal.";

    return;

  }

  const pet = {

    id: editingPetId || createId(),

    photo: selectedPhoto,

    sample: false

  };

  Object.entries(formFields).forEach(([key, id]) => {

    pet[key] = document.getElementById(id).value.trim();

  });

  if (!pet.name) {

    feedback.textContent = "Please enter the pet's name.";

    return;

  }

  const today = new Date();

  if (
    pet.birthday &&
    new Date(pet.birthday + "T00:00:00") > today
  ) {

    feedback.textContent =
      "The birthday cannot be in the future.";

    return;

  }

  if (
    pet.rescueDate &&
    new Date(pet.rescueDate + "T00:00:00") > today
  ) {

    feedback.textContent =
      "The rescue date cannot be in the future.";

    return;

  }

  if (
    pet.birthday &&
    pet.rescueDate &&
    pet.rescueDate < pet.birthday
  ) {

    feedback.textContent =
      "The rescue date cannot be before the birthday.";

    return;

  }

  let updatedPets;

  const isEditing = Boolean(editingPetId);

  if (isEditing) {

    updatedPets = savedPets.map(item =>
      item.id === editingPetId ? { ...item, ...pet } : item
    );

  } else {

    updatedPets = [...savedPets, pet];

  }

  if (!writeStorage(PET_STORAGE, updatedPets)) {

    feedback.textContent =
      "Browser storage is full or unavailable. Try a smaller photo or remove an unused listing.";

    return;

  }

  savedPets = updatedPets;

  uploadModal.close();

  resetUploadForm();

  activeFilter = "All";

  petSearch.value = "";

  $$(".filter-btn").forEach(button => {

    button.classList.toggle(
      "selected",
      button.dataset.filter === "All"
    );

  });

  renderPets();

  toast(
    isEditing
      ? `${pet.name}'s profile has been updated!`
      : `${pet.name} has been added to the pet listings!`
  );

  $("#adopt").scrollIntoView({
    behavior: "smooth"
  });

});


// CONTACT FORM

$("#contactForm").addEventListener("submit", event => {

  event.preventDefault();

  const data = new FormData(event.currentTarget);

  const name = data.get("name").trim();

  $("#formFeedback").textContent =
    `Thanks, ${name}! This is a demo form. Your message has not been sent to an inbox.`;

  event.currentTarget.reset();

});


// HIGHLIGHT NAVIGATION WHILE SCROLLING

const sections = $$("main section[id]");

if ("IntersectionObserver" in window) {

  const observer = new IntersectionObserver(entries => {

    entries.forEach(entry => {

      if (!entry.isIntersecting) return;

      const target = `#${entry.target.id}`;

      const matchingLink = $$(".nav-link").find(
        link => link.getAttribute("href") === target
      );

      if (!matchingLink) return;

      $$(".nav-link").forEach(link => {

        link.classList.toggle(
          "active",
          link === matchingLink
        );

      });

    });

  }, {
    rootMargin: "-35% 0px -55% 0px"
  });

  sections.forEach(section => observer.observe(section));

}


// INITIALIZE WEBSITE

renderPets();

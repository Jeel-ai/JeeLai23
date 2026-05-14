const expozice = [
  { nazev:"Interpretace", kategorie:"Filozofie", obrazek:"obrazky/interpretace.png" },
  { nazev:"Moderní kroniky", kategorie:"Současnost", obrazek:"obrazky/Modernikroniky.png" },
  { nazev:"Příběh národa", kategorie:"Společnost", obrazek:"obrazky/Pribehnaroda.png" },
  { nazev:"Jak vzniká kronika", kategorie:"Vzdělávání", obrazek:"obrazky/Jakvznikakronika.png" },
  { nazev:"Středověké Čechy", kategorie:"Historie", obrazek:"obrazky/Stredovekecechy.png" },
  { nazev:"Legendy vs realita", kategorie:"Interpretace", obrazek:"obrazky/Legendyvsrealita.png" },
  { nazev:"Kosmas – první kronikář", kategorie:"Historie", obrazek:"obrazky/Kosmasprvnikronikar.png" }
];

/* ===== CAROUSEL ===== */
function loadExpozice() {

  const container = document.getElementById("carouselInner");
  container.innerHTML = "";

  expozice.forEach((item, i) => {

    const div = document.createElement("div");
    div.className = "carousel-item" + (i === 0 ? " active" : "");

    div.innerHTML = `
      <img src="${item.obrazek}" class="d-block w-100 expo-img">

      <div class="carousel-caption expo-caption">

        <h3>${item.nazev}</h3>

        <span class="badge bg-light text-dark">
          ${item.kategorie}
        </span>

      </div>
    `;

    container.appendChild(div);
  });
}

loadExpozice();

/* ===== TIMER ===== */
let index = 0;
let targetDate = new Date();
targetDate.setDate(targetDate.getDate() + 7);

function update() {

  const now = new Date();
  let diff = targetDate - now;

  if (diff <= 0) {
    index = (index + 1) % expozice.length;
    targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    diff = targetDate - now;
  }

  const totalSeconds = Math.floor(diff / 1000);

  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  document.getElementById("countdown").innerText =
    `${days}d ${hours}h ${minutes}m ${seconds}s`;

  const item = expozice[index];

  document.getElementById("expoTeaser").innerText =
    `Po skončení timeru bude aktivní expozice: "${item.nazev}" (${item.kategorie})`;
}

setInterval(update, 1000);
update();

/* ===== REZERVACE ===== */
let savedData = null;

function confirmRezervace(event) {

  event.preventDefault();

  const form = event.target;

  const datumInput =
    form.querySelector('input[type="datetime-local"]').value;

  const time = datumInput.split("T")[1];

  if (time < "09:00" || time > "17:00") {
    alert("Rezervace je možná pouze mezi 9:00 a 17:00.");
    return;
  }

  savedData = {
    jmeno: form.querySelector('input[placeholder="Jméno"]').value,
    prijmeni: form.querySelector('input[placeholder="Příjmení"]').value,
    datum: datumInput,
    pocet: form.querySelector('input[placeholder="Počet lidí"]').value,
    email: form.querySelector('input[type="email"]').value,
    vstupenka: form.querySelector('#ticketType').value
  };

  const potvrzeni = confirm(
    `Potvrdit rezervaci?\n\n` +
    `Jméno: ${savedData.jmeno} ${savedData.prijmeni}\n` +
    `Vstupenka: ${savedData.vstupenka}\n` +
    `Datum: ${savedData.datum}\n` +
    `Počet lidí: ${savedData.pocet}\n` +
    `Email: ${savedData.email}`
  );

  if (potvrzeni) {
    sendRezervace();
  }
}

function sendRezervace() {

  alert(
    `Děkujeme za rezervaci!\n\n` +
    `Jméno: ${savedData.jmeno} ${savedData.prijmeni}\n` +
    `Vstupenka: ${savedData.vstupenka}\n` +
    `Datum: ${savedData.datum}\n` +
    `Počet lidí: ${savedData.pocet}\n` +
    `Email: ${savedData.email}`
  );

  document.querySelector("#rezMain form").reset();
}

function addReview(event) {
  event.preventDefault();

  const form = event.target;

  const jmeno = form.querySelector('input[placeholder="Jméno"]').value.trim();
  const prijmeni = form.querySelector('input[placeholder="Příjmení"]').value.trim();
  const text = form.querySelector('textarea').value.trim();

  if (!text) return;

  // 👉 LIMIT 120 ZNAKŮ
  if (text.length > 120) {
    alert("Recenze může mít maximálně 120 znaků.");
    return;
  }

  const stars =
    form.querySelector('input[name="star"]:checked')?.value || 5;

  const fileInput = document.getElementById("imgInput");

  let imgURL = "obrazky/profile.webp";

  if (fileInput.files && fileInput.files[0]) {
    imgURL = URL.createObjectURL(fileInput.files[0]);
  }

  const starText = "★★★★★☆☆☆☆☆".slice(5 - stars, 10 - stars);

  // 👉 TLACITKO OD 20 ZNAKU
  const showButton = text.length > 20;

  const shortText =
    text.length > 20 ? text.slice(0, 20) + "..." : text;

  const card = document.createElement("div");
  card.className = "col-12 col-sm-6 col-md-6";

  card.innerHTML = `
    <div class="card h-100 review-card shadow-sm">

      <img src="${imgURL}" class="card-img-top review-img">

      <div class="card-body d-flex flex-column">

        <h5 class="card-title">
          ${jmeno} ${prijmeni}
        </h5>

        <div class="stars mb-2">
          ${starText}
        </div>

        <p class="review-text flex-grow-1"
           data-full="${text}"
           data-short="${shortText}">
          ${shortText}
        </p>

        ${
          showButton
            ? `
          <div class="mt-3 text-center">
            <button
              type="button"
              class="btn btn-primary btn-sm"
              data-expanded="false"
              onclick="toggleReview(this)">
              Zobrazit víc
            </button>
          </div>
        `
            : ""
        }

      </div>

    </div>
  `;

  document.getElementById("reviewContainer").appendChild(card);

  form.reset();
}

function toggleReview(btn) {
  const card = btn.closest(".review-card");
  const text = card.querySelector(".review-text");

  const fullText = text.dataset.full;
  const shortText = text.dataset.short;

  const isExpanded = btn.dataset.expanded === "true";

  if (isExpanded) {
    text.innerText = shortText;
    btn.innerText = "Zobrazit víc";
    btn.dataset.expanded = "false";
  } else {
    text.innerText = fullText;
    btn.innerText = "Zobrazit méně";
    btn.dataset.expanded = "true";
  }
}





//PHP koutek

fetch("api.php?action=rezervace", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    jmeno: "Jan",
    prijmeni: "Novák",
    datum: "2026-05-14T12:00",
    pocet: 2,
    email: "test@test.cz",
    vstupenka: "VIP"
  })
});

const formData = new FormData();
formData.append("jmeno", "Jan");
formData.append("prijmeni", "Novák");
formData.append("text", "Super muzeum");
formData.append("stars", 5);
formData.append("image", fileInput.files[0]);

fetch("api.php?action=recenze", {
  method: "POST",
  body: formData
});

fetch("api.php?action=get_recenze")
  .then(r => r.json())
  .then(data => console.log(data));

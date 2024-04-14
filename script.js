let arr = [];
let db;
let currentAudio;
const logArr = [];

// Конструктор музыки
class sound {
  constructor(id, name, loaded) {
    this.id = id;
    this.name = name;
    this.loaded = loaded;
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/musiiiic/ServiceWorker.js")
      .then((registration) => {
        logArr.push(`"Service Worker зарегистрирован с областью видимости:",
        ${registration.scope}`);
      })
      .catch((error) => {
        console.error("Ошибка регистрации Service Worker:", error);
      });
  });
} else {
  console.log("Service Worker не поддерживается в данном браузере.");
}

async function showImage() {

  var src = document.getElementById('input-tag').value,
      img = document.createElement('img');
  const response = await fetch(src);
  const imageObjectURL = URL.createObjectURL(await response.blob());
  img.src = imageObjectURL;
  wrapper.appendChild(img);
}



let wrapper = document.querySelector(".wrapper");

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
      .register("/ServiceWorker.js")
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

function createBD() {
  return new Promise((resolve, reject) => {
    let openRequest = indexedDB.open("MusicDB", 10);
    openRequest.onupgradeneeded = function () {
      db = openRequest.result;
      if (!db.objectStoreNames.contains("musics")) {
        db.createObjectStore("musics", { keyPath: "key", autoIncrement: true });
      }
    };

    openRequest.onsuccess = function () {
      db = openRequest.result;
      resolve();
    };

    openRequest.onerror = function () {
      console.error("Ошибка открытия базы данных", openRequest.error);
      reject(openRequest.error);
    };
  });
}

function clearMusicsTable() {
  if (!db) {
    console.error("База данных не была открыта.");
    return;
  }
  let transaction = db.transaction("musics", "readwrite");
  let musics = transaction.objectStore("musics");
  let clearRequest = musics.clear();
  clearRequest.onsuccess = function () {
    logArr.push("Таблица musics успешно очищена.");
  };
  clearRequest.onerror = function (event) {
    console.error("Ошибка при очистке таблицы musics", event.target.error);
  };
}

function postMusic(music) {
  return new Promise((resolve, reject) => {
    if (!db) {
      logArr.push("База данных не была открыта.");
      reject("База данных не была открыта.");
      return;
    }

    let transaction = db.transaction("musics", "readwrite");
    let musics = transaction.objectStore("musics");
    // Добавляем запись с явно установленным ключом
    let request = musics.add(music);

    request.onsuccess = function () {
      logArr.push(`Песня добавлена в хранилище`);
      arr.push([music.id, music.name]); // Добавляем данные в массив arr
      paintingPlaceForSound();
      resolve();
    };

    request.onerror = function () {
      console.error("Ошибка", request.error);
      reject(request.error);
    };
  });
}

async function fetchData() {
  const response = await fetch(
    "https://5.nikpv.z8.ru/MobileDeviceOS/getcfg.php"
  );

  const data = await response.json();
  const root = data.root;
  return root;
}

async function createObjects() {
  const result = await fetchData();
  clearMusicsTable();
  for (let index = 0; index < result.length; index++) {
    const element = result[index];
    const elementMusic = new sound(index, element, false);
    await postMusic(elementMusic); // Дожидаемся выполнения операции postMusic перед следующей итерацией
  }
}

//createObjects();

async function paintingPlaceForSound() {
  await createBD(); // Дожидаемся открытия базы данных перед созданием объектов

  const transaction = db.transaction("musics", "readonly");
  const musics = transaction.objectStore("musics");
  const request = musics.getAll();

  request.onsuccess = function (event) {
    const musicsData = event.target.result;
    const wrapper = document.querySelector(".wrapper");
    wrapper.innerHTML = "";

    musicsData.forEach((music) => {
      wrapper.innerHTML += `<div id=${music.key} class='sound-wrapper'>
       <div>${music.name}</div> 
        <div id='button_${music.key}' onClick='playSound("${music.name}", "${music.key}")'>
        </div>
       </div>`;

      if (music.loaded == true) {
        document.getElementById(
          `button_${music.key}`
        ).innerHTML = `<img src='play.png'/>`;
        document
          .querySelector(`#button_${music.key} > img`)
          .classList.add("active");
      } else {
        document.getElementById(
          `button_${music.key}`
        ).innerHTML = `<img src='download.png'/>`;
      }
    });
  };

  request.onerror = function (event) {
    console.error(
      "Ошибка при извлечении данных из базы данных",
      event.target.error
    );
  };
}

paintingPlaceForSound();

function playSound(url, id) {
  const sound = document.querySelector(`#button_${id} > img`);

  // Проверяем, существует ли уже объект аудио
  if (currentAudio) {
    // Если воспроизведение уже идет, просто останавливаем его
    if (!currentAudio.paused) {
      currentAudio.pause();
      sound.src = "play.png";
      return; // Выходим из функции, т.к. уже остановили воспроизведение
    }
  }

  // Если аудио еще не воспроизводится, создаем новый объект аудио
  currentAudio = new Audio(
    `https://5.nikpv.z8.ru/MobileDeviceOS/get.php?url=${url}.mp3`
  );

  if (sound.classList.contains("active")) {
    currentAudio.addEventListener("loadeddata", function () {
      updateLoadedStatus(+id);
      if (currentAudio.paused) {
        currentAudio.play();
        sound.src = "pause.png";
      } else {
        currentAudio.pause();
        sound.src = "play.png";
      }
    });
  } else {
    sound.classList.add("active");
    sound.src = "play.png";
  }
}

function updateLoadedStatus(id) {
  let transaction = db.transaction("musics", "readwrite");
  let musics = transaction.objectStore("musics");
  let getRequest = musics.get(id);

  getRequest.onsuccess = function () {
    let music = getRequest.result;
    music.loaded = true;
    musics.put(music);
    logArr.push(`Статус загрузки для записи с id ${id} успешно обновлен`);
  };

  getRequest.onerror = function (event) {
    console.error(
      "Ошибка при получении записи из базы данных",
      event.target.error
    );
  };
}

let musicPage = document.querySelector(".musicPage");
let logPage = document.querySelector(".logPage");
let wrapper = document.querySelector(".wrapper");
let wrapperLog = document.querySelector(".wrapperLog");

logPage.addEventListener("click", () => {
  wrapperLog.classList.remove("hidden");
  wrapper.classList.add("hidden");
  logArr.forEach((elem) => {
    wrapperLog.innerHTML += `<div>${elem}</div>`;
  });
});

musicPage.addEventListener("click", () => {
  wrapperLog.classList.add("hidden");
  wrapper.classList.remove("hidden");
});

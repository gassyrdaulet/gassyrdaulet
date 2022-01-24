const minutes = document.querySelector(".minutes");
const seconds = document.querySelector(".seconds");
const deciSeconds = document.querySelector(".deci-seconds");
let timerTime = 300000;
let deciSecondG = 9;
let timerId;

timerId = setInterval(() => {
        minutes.innerText = parseInt(timerTime/60000);
        seconds.innerText = parseInt((timerTime/1000)%60);
        deciSeconds.innerText = deciSecondG;
        timerTime = timerTime - 100;
        deciSecondG = deciSecondG - 1;
        if(deciSecondG == -1){
            deciSecondG = 9;
        }
        if(timerTime == 0){
            clearInterval(timerId);
            deciSeconds.innerText = 0;
        }
    }, 100);

const rButton = document.querySelector(".return-button");
const sMenu = document.querySelector(".settings-menu ul");

rButton.addEventListener('click', ()=>{
    sMenu.classList.toggle("active");
    rButton.classList.toggle("active");
});

const inputIin = document.querySelector(".iin-number");
const inputBin = document.querySelector(".bin-number");
const actualIin = document.querySelector(".a-iin-number");
const actualBin = document.querySelector(".a-bin-number");
const startButton = document.querySelector(".settings-menu .start-button");

startButton.addEventListener('click', ()=>{
    actualIin.innerText = inputIin.value;
    actualBin.innerText = inputBin.value;
    sMenu.classList.toggle("active");
    rButton.classList.toggle("active");
});

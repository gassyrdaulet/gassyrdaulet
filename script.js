const minutes = document.querySelector(".minutes");
const seconds = document.querySelector(".seconds");
const deciSeconds = document.querySelector(".deci-seconds");
let timerTime = 300000;
let deciSecondG = 9;

let timerId = setInterval(() => {
    minutes.innerText = parseInt(timerTime/60000);
    seconds.innerText = parseInt((timerTime/1000)%60);
    deciSeconds.innerText = deciSecondG;
    timerTime = timerTime - 100;
    deciSecondG = deciSecondG - 1;
    if(deciSecondG == 0){
        deciSecondG = 9;
    }
    if(timerTime == 0){
        clearInterval(timerId);
        deciSeconds.innerText = 0;
    }
}, 100);


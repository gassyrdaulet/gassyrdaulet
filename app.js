const btnPrev = document.querySelector('.prev');
const btnNext = document.querySelector('.next');
const track = document.querySelector('.slider-track');
const descWindow = document.querySelector('.desc-window');
let position = 0;
let descPos = 0;
const slidesToShow = 1;
const slider_window = document.querySelector('.slider-window');
let itemWidth = slider_window.clientWidth / slidesToShow;
let itemWidthForDots = descWindow.clientWidth / slidesToShow;
const slidesToScroll = 1;
let itemsLeft;
const allItems = document.querySelectorAll('.slider-item');
let itemsCount = allItems.length;
const movePositionStep = itemWidth; 
const movePositionStepForDesc = itemWidthForDots;
const desc_items = document.querySelectorAll('.desc-item');
const desc_track = document.querySelector('.desc-track');
const allDots = document.querySelectorAll('.dots-item-text');
let dot_position = 0;

allItems.forEach((item) => {
    item.style.minWidth = `${itemWidth}px`;
});
desc_items.forEach((item) => {
    item.style.minWidth = `${itemWidthForDots}px`;
});

btnNext.addEventListener('click', () => {
    itemsLeft = itemsCount - (Math.abs(position) + slidesToShow * itemWidth) / itemWidth;    
    position = itemsLeft >= slidesToScroll ? position - movePositionStep : position - itemWidth * itemsLeft;
    descPos = itemsLeft >= slidesToScroll ? descPos - movePositionStepForDesc : descPos - itemWidthForDots * itemsLeft; 
    movePosition();
    checkButtons();
    dot_position++;
    checkDotPosition();
}); 
btnPrev.addEventListener('click', () => {
    itemsLeft = Math.abs(position) / itemWidth;
    position = itemsLeft >= slidesToScroll ? position + movePositionStep : position + itemWidth * itemsLeft;
    descPos = itemsLeft >= slidesToScroll ? descPos + movePositionStepForDesc : descPos + itemWidthForDots * itemsLeft; 
    movePosition();
    checkButtons();
    dot_position--;
    checkDotPosition();
}); 

const movePosition = () => {
    track.style.transform = `translateX(${position}px)`;
    desc_track.style.transform = `translateX(${descPos}px)`;
};
const checkButtons = () => {
    btnPrev.disabled = position === 0;
    btnNext.disabled = position <= -(itemsCount - slidesToShow) * itemWidth;
};
const checkDotPosition = () => {
    for(a in allDots){
        allDots[a].innerText = '○';
    }
    allDots[dot_position].innerText='◉';
}

checkDotPosition();
checkButtons();
console.log(allDots[0]);

const hamburger = document.querySelector('.header  .hamburger');
const mobile_menu = document.querySelector('.header .nav-list ul');
const menu_item = document.querySelectorAll('.header .nav-list ul li a');

hamburger.addEventListener('click', () => {
	hamburger.classList.toggle('active');
	mobile_menu.classList.toggle('active');
});

menu_item.forEach((item) => {
	item.addEventListener('click', () => {
		hamburger.classList.toggle('active');
		mobile_menu.classList.toggle('active');
	});
});
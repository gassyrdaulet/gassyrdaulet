const gasButton = document.querySelector('#main .main .game-controls .gas-button');
const wheels = document.querySelectorAll('.wheel');

console.log("Wasup, Dog");

wheels.forEach((item) => {
	gasButton.addEventListener('click', () => {
        gasButton.innerText = 'BREAK';
        item.classList.toggle('active');
        if(item.classList[1]!='active'){
            gasButton.innerText = 'GAS';
        }
	});
});
gasButton.addEventListener('click', () => {
    gasButton.classList.toggle('active');
});
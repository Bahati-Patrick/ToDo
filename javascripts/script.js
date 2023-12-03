// get DOM elements
const todoForm = document.querySelector('#todo-form');
const todoList = document.querySelector('.todos');
const totalTasks = document.querySelector('#total-tasks');
const completedTasks = document.querySelector('#completed-tasks');
const remainingTasks = document.querySelector('#remaining-tasks');
const importantTasks = document.querySelector('#important-tasks');
const mainInput = document.querySelector('#todo-form input');
const mainCategories = document.querySelector('[name=task-categories]');
const clearSortlink = document.getElementById('clear-sorts');


const selectedTasks = [];
const allCategories = [];

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// get all tasks
function getAllTasks() {
    if (localStorage.getItem('tasks')) {
        tasks.sort((a,b) => a.id - b.id ).map((task) => {
            createTask(task);
            if (task.isImportant){
                changeMarked(task.id, task);
            }        
        });
        countTasks()
    }
}

getAllTasks();

// prepare to do object
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const inputValue = mainInput.value;

    const checkTask = tasks.find(task => task.name === inputValue);

    if (inputValue == ''){
        return
    } else if(checkTask) {
        alert('This todo is already in your todos list')
        inputValue.innerHTML = ''
        return
    }

    const task = {
        id: new Date().getTime(),
        name: inputValue,
        isCompleted: false,
        isImportant: false,
        categories: [],
    }

    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));

    createTask(task);

    todoForm.reset();
    mainInput.focus();
});

// get task's id and delete
todoList.addEventListener('click', (e) => {
    if(e.target.classList.contains('remove-task') || 
    e.target.parentElement.classList.contains('remove-task') ||
    e.target.parentElement.parentElement.classList.contains('remove-task')){
        const taskId = e.target.closest('li').id;

        removeTask(taskId);
    }
});


// get task's id and update
todoList.addEventListener('input', (e) => { 
    const taskId = e.target.closest('li').id;

    updateTask(taskId, e.target);
});

// exit edit mode and prvent new line on enter
todoList.addEventListener('keydown', (e) => {
    if(e.keyCode === 13) {
        e.preventDefault();

        e.target.blur();
    }
});


// create task
function createTask(task){
    const taskEl = document.createElement('li');

    taskEl.setAttribute('id', task.id);

    if (task.isCompleted) {
        taskEl.classList.add("complete");
    }

    const categoriesLength = task.categories? task.categories.length : 0;    

    const taskElMarkup = `
        <div>
            <input type="checkbox" name="tasks" id="${task.id}" ${task.isCompleted ? 'checked' : ''}>
            <span ${task.isCompleted ? '': 'contenteditable'} class="task_name">${task.name}</span>
        </div>
        <div>
            <button class="add_category">
                <span title="add category" ><i class="fa-solid fa-plus"></i></span>
            </button>            
            <button title="Mark as Important" class="mark-task">
                <span>Mark</span>
            </button>
            <button title="Remove the ${task.name}" class="remove-task">
                <span>Delete</span>
            </button>
        </div>
        <div class="categories">      
            ${task.categories ? task.categories.map((category) => '<span class="category">' + category + ' ' +'<i title="remove' +' '+ category +'" class="fa-solid fa-xmark remove_category"></i></span>')  : ''} 
        </div>
    `;

    taskEl.innerHTML = taskElMarkup;

    const referenceTask = todoList.firstChild;

    todoList.insertBefore(taskEl, referenceTask);

    countTasks()

    // get task id and mark it as important
    const markButton = taskEl.querySelector('.mark-task');
    markButton.addEventListener('click', (e)=>{
        markAsImportant(task.id)
    }); 

    // get task id and add category
    const addCategoryBtn = taskEl.querySelector('.add_category');
    addCategoryBtn.addEventListener('click', (e)=>{
        document.getElementById('overlay').style.display = 'block';
        document.getElementById('categoryModal').style.display = 'block';
        selectedTasks.push(task.id);
        getExistingCategories()
        
    });

    
    // get remove category buttons
    const removeCategoryButton = taskEl.querySelectorAll(".remove_category");
    removeCategoryButton.forEach((button)=>{
        button.addEventListener('click', (e) => {
            removeCategory(task.id,e);
        });
    })
    
}

// count tasks
function countTasks() {
    const completedTasksArray = tasks.filter(
        (task) => task.isCompleted === true );
    
    const importantTasksArray = tasks.filter(
        (task) => task.isImportant === true);

    totalTasks.textContent = tasks.length;
    importantTasks.textContent = importantTasksArray.length;
    completedTasks.textContent = completedTasksArray.length
    remainingTasks.textContent = tasks.length - completedTasksArray.length;

}

// remove task
function removeTask(taskId){
    tasks = tasks.filter((task) => task.id !== parseInt(taskId));

    localStorage.setItem('tasks', JSON.stringify(tasks));

    document.getElementById(taskId).remove();

    countTasks();
}

// update task
function updateTask(taskId, el) {
    const task = tasks.find((task) => task.id === parseInt(taskId));

    if(el.hasAttribute('contenteditable')) {
        task.name = el.textContent
    } else {
        const span = el.nextElementSibling;
        const parent = el.closest('li');

        task.isCompleted = !task.isCompleted;

        if (task.isCompleted) {
            span.removeAttribute('contenteditable');
            parent.classList.add('complete');           
        } else {
            span.setAttribute('contenteditable', 'true');
            parent.classList.remove('complete');
        }

    }

    localStorage.setItem('tasks', JSON.stringify(tasks));

    countTasks()
}

// mark / unmark task as important
function markAsImportant(taskId) {
    const task = tasks.find((task) => task.id === parseInt(taskId));
    task.isImportant = !task.isImportant;

    changeMarked(taskId, task);

    localStorage.setItem('tasks', JSON.stringify(tasks));

    countTasks();
}

// change style of marked / unmarked task
function changeMarked(taskId, task){
    const taskEl = document.getElementById(taskId);
    const taskElMarkButtonSpan = taskEl.childNodes[3].childNodes[3];
    const taskElMarkButton = taskEl.childNodes[3].childNodes[1];

    if (task.isImportant) {
        taskEl.classList.toggle('important');
        taskElMarkButtonSpan.textContent = 'Unmark'
        taskElMarkButton.setAttribute('title','Unmark as Important');
    } else {
        taskEl.classList.toggle('important');
        taskElMarkButtonSpan.textContent = 'Mark'
        taskElMarkButton.setAttribute('title','Mark as Important');
    }
}

// ================================================================================================================================================
// sorting functionality

// Get all the sort buttons by their class name
const sortLinks = document.getElementsByClassName('sort_link');

// Loop through each sort button and add an event listener
for (let link of sortLinks) {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    let sortOption = link.id.split('-')[2];
    sortTasks(sortOption);
    clearSortlink.classList.add('clear_sorts');
  });
}

// sort function 
function sortTasks(sortOption) {
  let allOptions = {
    importance: (a, b) => a.isImportant - b.isImportant,
    ascending: (a, b) => b.name.localeCompare(a.name),
    descending: (a, b) => a.name.localeCompare(b.name),
    old: (a, b) => b.id - a.id,
    new: (a, b) => a.id - b.id,
    completion: (a, b) => a.isCompleted - b.isCompleted
  };

  tasks.sort(allOptions[sortOption]);
  // Update the tasks order on the page after sorting
  updateTasksOrder();
}

// update tasks order on screen 
function updateTasksOrder() {
  todoList.innerHTML = '';

  tasks.forEach((task) => {
    createTask(task);
    if (task.isImportant){
      changeMarked(task.id, task);
    }  
    countTasks();
  });
}

// get the clear sorting link
clearSortlink.addEventListener('click', () => {
    clearSorting();
    clearSortlink.classList.remove('clear_sorts');
});

// clear sort function
function clearSorting() {    
    todoList.innerHTML = '';
    getAllTasks();
    countTasks();
}


// get existing categories form all tasks
function getExistingCategories () {
    tasks.forEach((task) => {
        task.categories.forEach((category)=>{
            allCategories.push(category);
        })            
    });
    const filteredCategories = [...new Set(allCategories)];
    
    const categoriesList = document.getElementById('categoryList');

    let temp = '';
    filteredCategories.forEach((category) => {
        temp += `<li class='single_category'> ${category} </li>`;    
    })
    categoriesList.innerHTML = temp;

    // use existing category
    const existingCategory = categoriesList.querySelectorAll('.single_category');

    existingCategory.forEach((category) => {
        category.addEventListener('click', (e) => {
            const selectedCategory = e.target.innerText;
            document.getElementById('newCategory').value = selectedCategory;
        });
    });
}


// remove category
function removeCategory(taskId,e){
    // const taskId = e.target.closest('li').id;
    const task = tasks.find((task) => task.id === parseInt(taskId));

    const categoryName = e.target.closest('span');

    const categoryIndex = task.categories.indexOf(categoryName.textContent.trim())  

    task.categories.splice(categoryIndex,1);

    localStorage.setItem('tasks', JSON.stringify(tasks));

    categoryName.remove()

    getExistingCategories()
}

// add category to task
const addCategoryButton = document.querySelector('.add_category')
const saveCategoryButton = document.getElementById('saveCategoryBtn')
const cancelCategoryPopup = document.getElementById('cancelCategoryBtn')

// dismiss new category modal
cancelCategoryPopup.addEventListener('click', function () {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('categoryModal').style.display = 'none';
    document.getElementById('newCategory').value = '';
    selectedTasks.pop(1);
});

// create a category
saveCategoryButton.addEventListener('click',() => {
    const newCategory = document.getElementById('newCategory').value.trim();

    const taskId = selectedTasks[0];

    const task = tasks.find((task) => task.id === parseInt(taskId));

    if (!newCategory){
        alert("Please enter a valid name for the Category")
        return
    } else {
        if(task.categories.includes(newCategory)){
            alert(`${newCategory} already exists`)
            selectedTasks.pop(1);
            return
        }else if(task.categories.length == 3) {
            alert(`You have reached maximum number of categories for ${task.name}.`)
            selectedTasks.pop(1);
        } else {
            task.categories.push(newCategory);
        }
        
    }

    document.getElementById('overlay').style.display = "none";
    document.getElementById('categoryModal').style.display = "none";
    document.getElementById('newCategory').value = '';
    selectedTasks.pop(1);
    localStorage.setItem('tasks', JSON.stringify(tasks))
    todoList.innerHTML = '';
    getAllTasks();  
    populateAllCategories();  

});


// =======================================================================
// filter functionality

// get filter dropdown content div
const dropdownContentDiv = document.querySelector('.filter');

function populateAllCategories() {
    tasks.forEach((task) => {
        task.categories.forEach((category)=>{
            allCategories.push(category);
        })            
    });
    const filteredCategories = [...new Set(allCategories)];

    let categoriesLinks = ''

    filteredCategories.forEach((category) => {
        categoriesLinks += ` <a href="#" class="filterOption">${category}</a>`
    });
    dropdownContentDiv.innerHTML = categoriesLinks;

    // set filters
    const categoryFilters = document.getElementsByClassName('filterOption');
    Array.from(categoryFilters).forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showFilteredTasks(e.target.textContent.trim());
            clearSortlink.classList.add('clear_sorts');
        })
    });
}

populateAllCategories();

// show filtered tasks
function showFilteredTasks(selectedFilter){
    const filteredTasks = [];
    tasks.forEach((task) => {
        if(task.categories.includes(selectedFilter)){ 
            filteredTasks.push(task);
        }
    });
    displayTaskList(filteredTasks);
}

// display filtered tasks by categories
function displayTaskList(filteredTasks){
    todoList.innerHTML = '';
    filteredTasks.forEach((task) => {
        createTask(task);
        countTasks();
    });
}

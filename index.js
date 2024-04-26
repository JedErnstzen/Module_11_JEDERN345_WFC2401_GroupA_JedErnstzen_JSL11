// Section 1: Imports and Initialization

// Import helper functions from utils
import { createNewTask, deleteTask, getTasks, putTask } from "./utils/taskFunctions.js";
// Import initialData
import { initialData } from "./initialData.js";

// Clear localStorage

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  if (!localStorage.getItem("tasks")) { // Check if tasks data exists in local storage
    localStorage.setItem("tasks", JSON.stringify(initialData)); // If not, set tasks data to initialData
    localStorage.setItem("showSideBar", "true"); // Set default value for showSideBar
  } else {
    console.log("Data already exists in localStorage"); // Log a message if data already exists
  }
}


initializeData(); // Call function to initialize data

// Section 2: DOM Elements and Global Variable

// Get elements from the DOM
const elements = {
  editTaskModal: document.querySelector('.edit-task-modal-window'), // Select edit task modal
  modalWindow: document.querySelector('.modal-window'), // Select modal window
  themeSwitch: document.querySelector('#switch'), // Select theme switch element
  showSideBarBtn: document.querySelector('#show-side-bar-btn'), // Select show sidebar button
  hideSideBarBtn: document.querySelector('#hide-side-bar-btn'), // Select hide sidebar button
  filterDiv: document.getElementById('filterDiv'), // Select filter div
  columnDivs: document.querySelectorAll('.column-div'), // Select all column divs
  headerBoardName: document.getElementById('header-board-name'), // Select header board name element
  toggleDiv: document.querySelectorAll('.toggle-div'), // Select all toggle divs
  headlineSidePanel: document.getElementById('headline-sidepanel') // Select headline side panel
};

console.log(elements.editTaskModal); // Log edit task modal element

let activeBoard = ""; // Declare variable to store active board

// Section 3: Task Management

// Fetches and displays boards and tasks
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks(); // Get tasks from local storage
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))]; // Extract unique board names from tasks
  displayBoards(boards); // Display boards in the UI
  if (boards.length > 0) { // If there are boards available
    activeBoard = JSON.parse(localStorage.getItem("activeBoard")) || boards[0]; // Set active board to the first board or the one stored in local storage
    elements.headerBoardName.textContent = activeBoard; // Set header board name
    styleActiveBoard(activeBoard); // Style active board
    refreshTasksUI(); // Refresh tasks UI
  }

  const createNewTaskBtn = document.getElementById('add-new-task-btn'); // Select create new task button
  createNewTaskBtn.addEventListener('click', () => { // Add event listener for clicking on create new task button
    toggleModal(true); // Show modal
    elements.filterDiv.style.display = 'block'; // Show filter div

    // Ensure activeBoard is correctly set before adding a new task
    activeBoard = elements.headerBoardName.textContent; // Set active board
  });

}

function addTask(event) { // Function to add task
  event.preventDefault(); // Prevent default form submission behavior

  const titleInput = document.getElementById('title-input'); // Select title input element
  const description = document.getElementById('desc-input'); // Select description input element
  const status = document.querySelector('#select-status'); // Select status select element

  const task = { // Create task object
    title: titleInput.value, // Set task title
    description: description.value, // Set task description
    status: status.value, // Set task status
    board: activeBoard // Assign the active board to the new task
  };

  const newTask = createNewTask(task); // Create new task
  if (newTask) { // If new task is created successfully
    addTaskToUI(newTask); // Add task to UI
    toggleModal(false); // Hide modal
    elements.filterDiv.style.display = 'none'; // Hide filter div
    event.target.reset(); // Reset form
    refreshTasksUI(); // Refresh tasks UI
  }
}

function addTaskToUI(task) { // Function to add task to UI
  const column = document.querySelector( // Select column corresponding to task status
    `.column-div[data-status="${task.status}"]`
  );
  if (!column) { // If column is not found
    console.error(`Column not found for status: ${task.status}`); // Log error
    return;
  }

  let tasksContainer = column.querySelector('.tasks-container'); // Select tasks container in column
  if (!tasksContainer) { // If tasks container is not found
    console.warn(
      `Tasks container not found for status: ${task.status}, creating one.`
    );
    tasksContainer = document.createElement("div"); // Create tasks container
    tasksContainer.className = "tasks-container"; // Set class name for tasks container
    column.appendChild(tasksContainer); // Append tasks container to column
  }

  const taskElement = document.createElement("div"); // Create task element
  taskElement.className = "task-div"; // Set class name for task element
  taskElement.textContent = task.title; // Set text content for task element
  taskElement.setAttribute("data-task-id", task.id); // Set data attribute for task element

  tasksContainer.appendChild(taskElement); // Append task element to tasks container

  // Update initialData and localStorage with the new task
  initialData.push(task); // Push new task to initialData
  localStorage.setItem("tasks", JSON.stringify(initialData)); // Update tasks data in local storage
}

// Section 4: Board Management

// Creates different boards in the DOM
function displayBoards(boards) { // Function to display boards
  const sidebar = document.getElementById("boards-nav-links-div"); // Select sidebar element
  sidebar.innerHTML = ''; // Clear the sidebar

  boards.forEach(board => { // Loop through boards
    const boardElement = document.createElement("button"); // Create button element for board
    boardElement.textContent = board; // Set text content for board button
    boardElement.classList.add("board-btn"); // Add class to board button
    boardElement.addEventListener("click", () => { // Add event listener for clicking on board button
      elements.headerBoardName.textContent = board; // Update header with board name
      filterAndDisplayTasksByBoard(board); // Filter and display tasks for selected board
      activeBoard = board; // Set active board
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard)); // Store active board in local storage
      styleActiveBoard(activeBoard); // Style active board
    });
    sidebar.appendChild(boardElement); // Append board button to sidebar
  });
}

// Filters tasks corresponding to the board name and displays them on the DOM.
function filterAndDisplayTasksByBoard(boardName) { // Function to filter and display tasks by board
  const tasks = getTasks(); // Get tasks from local storage
  const filteredTasks = tasks.filter(task => task.board === boardName); // Filter tasks by board name

  elements.columnDivs.forEach(column => { // Loop through column divs
    const status = column.dataset.status || ''; // Get status from column dataset
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`; // Set inner HTML for column

    const tasksContainer = document.createElement("div"); // Create tasks container
    tasksContainer.className = "tasks-container"; // Add class name to tasks container
    column.appendChild(tasksContainer); // Append tasks container to column

    filteredTasks.filter(task => task.status === status).forEach(task => { // Loop through filtered tasks
      const taskElement = document.createElement("div"); // Create task element
      taskElement.classList.add("task-div"); // Add class to task element
      taskElement.textContent = task.title; // Set text content for task element
      taskElement.dataset.taskId = task.id; // Set dataset for task element

      taskElement.addEventListener('click', function () { // Add event listener for clicking on task element
        openEditTaskModal(task); // Open edit task modal
      });

      tasksContainer.appendChild(taskElement); // Append task element to tasks container
    });
  });
}

function refreshTasksUI() { // Function to refresh tasks UI
  filterAndDisplayTasksByBoard(activeBoard); // Filter and display tasks for active board
}

function styleActiveBoard(boardName) { // Function to style active board
  document.querySelectorAll('.board-btn').forEach(btn => { // Loop through board buttons
    if (btn.textContent === boardName) { // If button text matches active board name
      btn.classList.add('active'); // Add active class to button
    } else {
      btn.classList.remove('active'); // Otherwise, remove active class from button
    }
  });
}

// Section 5: Event Handling

function setupEventListeners() { // Function to set up event listeners
  const cancelEditBtn = document.getElementById('cancel-edit-btn'); // Select cancel edit button
  cancelEditBtn.addEventListener('click', function () { // Add event listener for clicking on cancel edit button
    toggleModal(false, elements.editTaskModal); // Hide edit task modal
  });

  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn'); // Select cancel add task button
  cancelAddTaskBtn.addEventListener('click', () => { // Add event listener for clicking on cancel add task button
    toggleModal(false); // Hide modal
    elements.filterDiv.style.display = 'none'; // Hide filter div
  });

  elements.filterDiv.addEventListener('click', () => { // Add event listener for clicking on filter div
    toggleModal(false); // Hide modal
    elements.filterDiv.style.display = 'none'; // Hide filter div
  });

  elements.hideSideBarBtn.addEventListener("click", () => toggleSidebar(false)); // Add event listener for clicking on hide sidebar button
  elements.showSideBarBtn.addEventListener("click", () => toggleSidebar(true)); // Add event listener for clicking on show sidebar button

  elements.themeSwitch.addEventListener('change', toggleTheme); // Add event listener for changing theme

  const createNewTaskBtn = document.getElementById('add-new-task-btn'); // Select create new task button
  createNewTaskBtn.addEventListener('click', () => { // Add event listener for clicking on create new task button
    toggleModal(true); // Show modal
    elements.filterDiv.style.display = 'block'; // Show filter div
  });

  elements.modalWindow.addEventListener('submit', (event) => { // Add event listener for submitting modal form
    addTask(event); // Call addTask function
  });
}

function toggleModal(show, modal = elements.modalWindow) { // Function to toggle modal visibility
  modal.style.display = show ? 'block' : 'none'; // Show or hide modal based on show parameter
}

function toggleSidebar(show) { // Function to toggle sidebar visibility
  const sidebar = document.getElementById("side-bar-div"); // Select sidebar element
  if (show) { // If show is true
    sidebar.style.display = "block"; // Show sidebar
    elements.showSideBarBtn.style.display = "none"; // Hide show sidebar button
  } else { // If show is false
    sidebar.style.display = "none"; // Hide sidebar
    elements.showSideBarBtn.style.display = "block"; // Show show sidebar button
  }
}

function toggleTheme() { // Function to toggle theme
  const body = document.body; // Select body element
  body.classList.toggle("dark-theme"); // Toggle dark theme class
  body.classList.toggle("light-theme"); // Toggle light theme class
}

// Section 6: Task Editing

function openEditTaskModal(task) { // Function to open edit task modal
  const titleInput = document.getElementById("edit-task-title-input"); // Select edit task title input
  const descInput = document.getElementById("edit-task-desc-input"); // Select edit task description input
  const statusSelect = document.getElementById("edit-select-status"); // Select edit task status select

  titleInput.value = task.title; // Set value for edit task title input
  descInput.value = task.description; // Set value for edit task description input
  statusSelect.value = task.status; // Set value for edit task status select

  const saveChangesBtn = document.getElementById("save-task-changes-btn"); // Select save changes button
  const deleteTaskBtn = document.getElementById("delete-task-btn"); // Select delete task button

  saveChangesBtn.addEventListener("click", function () { // Add event listener for clicking on save changes button
    saveTaskChanges(task.id); // Call saveTaskChanges function
  });

  deleteTaskBtn.addEventListener("click", () => { // Add event listener for clicking on delete task button
    deleteTask(task.id); // Call deleteTask function
    toggleModal(false, elements.editTaskModal); // Hide edit task modal
    refreshTasksUI(); // Refresh tasks UI
    // Inside the deleteTask function after saving the updated tasks
    // Call the refreshUI function to update the UI
  });

  toggleModal(true, elements.editTaskModal); // Show edit task modal
}

function saveTaskChanges(taskId) { // Function to save task changes
  // Get new user inputs
  const updatedTitle = document.getElementById("edit-task-title-input").value; // Get updated title
  const updatedDescription = document.getElementById("edit-task-desc-input").value; // Get updated description
  const updatedStatus = document.getElementById("edit-select-status").value; // Get updated status

  // Get the tasks from local storage
  let tasks = getTasks();

  // Check if a task with the same ID already exists
  const duplicatedTaskIndex = tasks.findIndex(task => task.id === taskId);

  if (duplicatedTaskIndex !== -1) {
    // If the task already exists, update its properties
    tasks[duplicatedTaskIndex].title = updatedTitle;
    tasks[duplicatedTaskIndex].description = updatedDescription;
    tasks[duplicatedTaskIndex].status = updatedStatus;
  } else {
    // If the task doesn't exist, create a new task object
    const newTask = {
      id: taskId,
      title: updatedTitle,
      description: updatedDescription,
      status: updatedStatus
    };

    // Add the new task to the tasks array
    tasks.push(newTask);
  }

  // Save the updated tasks array back to local storage
  localStorage.setItem("tasks", JSON.stringify(tasks));

  // Invoke putTask to update the Database
  putTask(tasks[duplicatedTaskIndex]);

  refreshTasksUI(); // Refresh the UI to reflect the changes

  toggleModal(false, elements.editTaskModal); // Close the modal
}

// Section 7: Initialization and Entry Point

document.addEventListener('DOMContentLoaded', function () { // Add event listener for DOMContentLoaded event
  init(); // Call init function
  refreshTasksUI(); // Call refreshTasksUI function after the DOM is fully loaded
});

function init() { // Initialization function
  setupEventListeners(); // Set up event listeners
  const showSidebar = localStorage.getItem("showSideBar") === "true"; // Get showSidebar value from local storage
  toggleSidebar(showSidebar); // Toggle sidebar visibility based on showSidebar value
  const isLightTheme = localStorage.getItem("light-theme") === "enabled"; // Get isLightTheme value from local storage
  document.body.classList.toggle("light-theme", isLightTheme); // Toggle light theme based on isLightTheme value

  // Fetch tasks from local storage
  const tasks = getTasks(); // Get tasks from local storage

  // Extract board names from tasks
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))]; // Extract unique board names from tasks
  // Call functions to fetch and display boards
  fetchAndDisplayBoardsAndTasks(boards); // Fetch and display boards
  displayBoards(boards); // Display boards
}

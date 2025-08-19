document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    // Select all necessary elements from the HTML to manipulate them with JavaScript.
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskDueDateInput = document.getElementById('task-due-date');
    const taskPriorityInput = document.getElementById('task-priority');
    const taskList = document.getElementById('task-list');
    const dateDisplay = document.getElementById('date-display');
    const editModal = document.getElementById('edit-modal');
    const editTaskInput = document.getElementById('edit-task-input');
    const editTaskDueDateInput = document.getElementById('edit-task-due-date');
    const editTaskPriorityInput = document.getElementById('edit-task-priority');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const closeBtn = document.querySelector('.close-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const emptyState = document.getElementById('empty-state');

    // --- Application State ---
    // 'tasks' will hold our array of to-do items.
    // 'currentFilter' tracks which view is active (all, pending, completed).
    let tasks = [];
    let currentEditTaskId = null;
    let currentFilter = 'all';

    // --- Core Functions ---

    // Load tasks from browser's local storage.
    const loadTasks = () => {
        try {
            const storedTasks = localStorage.getItem('tasks');
            // If tasks exist in storage, parse them, otherwise start with an empty array.
            tasks = storedTasks ? JSON.parse(storedTasks) : [];
        } catch (e) {
            console.error("Error loading tasks from local storage:", e);
            tasks = []; // Start fresh if there's an error.
        }
    };

    // Save the current 'tasks' array to local storage.
    const saveTasks = () => {
        try {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        } catch (e) {
            console.error("Error saving tasks to local storage:", e);
        }
    };

    // The main function to display tasks on the screen.
    const renderTasks = () => {
        // Clear the list to prevent duplicates on re-render.
        taskList.innerHTML = '';

        // Filter the tasks based on the current view ('all', 'pending', 'completed').
        const tasksToRender = tasks.filter(task => {
            if (currentFilter === 'completed') return task.completed;
            if (currentFilter === 'pending') return !task.completed;
            return true;
        });

        // Logic to show either the task list or an "empty state" message.
        if (tasks.length === 0) {
            emptyState.style.display = 'block';
            taskList.style.display = 'none';
            emptyState.querySelector('p').textContent = 'No tasks yet. Add one to get started!';
        } else if (tasksToRender.length === 0) {
            emptyState.style.display = 'block';
            taskList.style.display = 'none';
            emptyState.querySelector('p').textContent = 'No tasks match the current filter.';
        } else {
            emptyState.style.display = 'none';
            taskList.style.display = 'block';
            
            // Create and append an HTML element for each task.
            tasksToRender.forEach(task => {
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''}`;
                li.dataset.id = task.id;
                li.dataset.priority = task.priority;

                // Checkbox for completion status
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = task.completed;
                checkbox.addEventListener('change', () => toggleComplete(task.id));

                // Container for task text and due date
                const taskDetails = document.createElement('div');
                taskDetails.className = 'task-details';
                const taskText = document.createElement('span');
                taskText.className = 'task-text';
                taskText.textContent = task.text;
                const taskDueDate = document.createElement('div');
                taskDueDate.className = 'task-due-date';
                if (task.dueDate) {
                    taskDueDate.textContent = `Due: ${new Date(task.dueDate).toLocaleString()}`;
                }
                taskDetails.appendChild(taskText);
                taskDetails.appendChild(taskDueDate);

                // Container for edit and delete buttons
                const taskActions = document.createElement('div');
                taskActions.className = 'task-actions';
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-btn';
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.addEventListener('click', () => openEditModal(task));
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.addEventListener('click', () => deleteTask(task.id));
                taskActions.appendChild(editBtn);
                taskActions.appendChild(deleteBtn);

                // Assemble the task item and add it to the list
                li.appendChild(checkbox);
                li.appendChild(taskDetails);
                li.appendChild(taskActions);
                taskList.appendChild(li);
            });
        }
        // Update the progress bar after every render.
        updateProgress();
    };

    // Handles the submission of the new task form.
    const addTask = (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (text === '') return;

        const newTask = {
            id: Date.now(),
            text,
            completed: false,
            dueDate: taskDueDateInput.value,
            priority: taskPriorityInput.value,
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        taskForm.reset();
    };

    // Toggles the 'completed' status of a task.
    const toggleComplete = (id) => {
        tasks = tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
    };

    // Deletes a task from the list.
    const deleteTask = (id) => {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    };

    // Opens the modal to edit a task.
    const openEditModal = (task) => {
        currentEditTaskId = task.id;
        editTaskInput.value = task.text;
        editTaskDueDateInput.value = task.dueDate || '';
        editTaskPriorityInput.value = task.priority || 'low';
        editModal.style.display = 'flex';
    };

    // Closes the edit modal.
    const closeEditModal = () => {
        editModal.style.display = 'none';
        currentEditTaskId = null;
    };

    // Saves changes from the edit modal.
    const saveEditedTask = () => {
        const newText = editTaskInput.value.trim();
        if (newText === '' || !currentEditTaskId) return;

        tasks = tasks.map(task =>
            task.id === currentEditTaskId ? {
                ...task,
                text: newText,
                dueDate: editTaskDueDateInput.value,
                priority: editTaskPriorityInput.value,
            } : task
        );
        saveTasks();
        renderTasks();
        closeEditModal();
    };

    // Updates the completion progress bar.
    const updateProgress = () => {
        const completedTasks = tasks.filter(task => task.completed).length;
        const totalTasks = tasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}% Complete`;
    };

    // Sets up all the initial event listeners.
    const setupEventListeners = () => {
        taskForm.addEventListener('submit', addTask);
        closeBtn.addEventListener('click', closeEditModal);
        saveEditBtn.addEventListener('click', saveEditedTask);
        window.addEventListener('click', (e) => {
            if (e.target === editModal) closeEditModal();
        });

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderTasks();
            });
        });
    };
    
    // The main function to initialize the application.
    const init = () => {
        dateDisplay.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        setupEventListeners();
        loadTasks();
        renderTasks();
    };

    // Start the application.
    init();
});

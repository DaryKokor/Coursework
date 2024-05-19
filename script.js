let studentsData = {};

function uploadFile() {
    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const contents = e.target.result;
            Papa.parse(contents, {
                header: true,
                complete: function (results) {
                    const tab2TableBody = document.querySelector('#Tab2 #uploadedTable tbody')
                    const tab1TableBody = document.querySelector('#Tab1 #uploadedTable tbody')

                    tab1TableBody.innerHTML = '';
                    tab2TableBody.innerHTML = '';
                    studentsData = {};

                    results.data.forEach(function (row) {
                        studentsData[row.name] = { ...row };

                        const tr = createTableRow(row, tab1TableBody);
                        tab1TableBody.appendChild(tr);

                        if (tab2TableBody) {
                            const trWithDeleteButton = createTableRowWithDeleteButton(row);
                            tab2TableBody.appendChild(trWithDeleteButton);
                        }
                    });
                }
            })

            updateStatisticsTable();
            drawChartSubject();
            drawChartStudents();
        }

        reader.readAsText(file, 'UTF-8');
    }

}

function createTableRow(row, tableBody) {
    const tr = document.createElement('tr');

    Object.values(row).forEach(function (value, index) {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
    });

    
    return tr;
}

function createEditableCell(value) {
    const td = document.createElement('td');
    td.textContent = value;
    td.addEventListener('dblclick', function() {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        td.textContent = '';
        td.appendChild(input);
        input.focus();

        input.addEventListener('blur', function() {
            saveCellValue(td, input.value);
        });

        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                saveCellValue(td, input.value);
            }
        });
    });
    return td;
}

// Функция для сохранения значения ячейки
function saveCellValue(td, value) {
    td.textContent = value;
    updateStudentData(td.closest('tr'), td.cellIndex, value);
}

// Функция для обновления данных студента
function updateStudentData(row, cellIndex, value) {
    const studentName = row.getAttribute('data-student-name');
    const keys = ['name', 'class', 'informatics', 'physics', 'mathemathics', 'literature', 'music'];
    const key = keys[cellIndex];
    studentsData[studentName][key] = value;

    updateStatisticsTable();
    drawChartSubject();
    drawChartStudents();
}

function createTableRowWithDeleteButton(row) {
    const tr = document.createElement('tr');
    Object.values(row).forEach(function (value) {
        const td = createEditableCell(value);
        tr.appendChild(td);
    });

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Удалить';
    deleteButton.classList.add('delete-button');
    deleteButton.addEventListener('click', function () {
        deleteRow(this, row.name);
    });

    const td = document.createElement('td');
    td.appendChild(deleteButton);
    tr.appendChild(td);
    tr.setAttribute('data-student-name', row.name);

    return tr;
}

function deleteRow(buttonElement, studentName) {
    const row = buttonElement.closest('tr');

    // Удаляем запись из studentsData
    delete studentsData[studentName];

    // Удаляем строку из таблицы
    row.remove();
    
    // Обновляем таблицы и графики
    updateStatisticsTable();
    drawChartSubject();
    drawChartStudents();
}

// Логика добавления записи в главный массив и в таблицу
// Подгружаем весь DOM и находим нужные элементы на странице
document.addEventListener("DOMContentLoaded", function() {
    const formAddPerson = document.getElementById('addRowForm');
    formAddPerson.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const classValue = document.getElementById('class').value;
        const informatics = document.getElementById('informatics').value;
        const physics = document.getElementById('physics').value;
        const mathemathics = document.getElementById('mathemathics').value;
        const literature = document.getElementById('literature').value;
        const music = document.getElementById('music').value;

        studentsData[name] = { name, class: classValue, informatics, physics, mathemathics, literature, music };
        const newRow = createTableRow(studentsData[name]);
        document.querySelector('#Tab1 #uploadedTable tbody').appendChild(newRow);
        const tab2TableBody = document.querySelector('#Tab2 #uploadedTable tbody');
        if (tab2TableBody) {
            const newRowWithDeleteButton = createTableRowWithDeleteButton(studentsData[name]);
            tab2TableBody.appendChild(newRowWithDeleteButton);
        }
        formAddPerson.reset();
        updateStatisticsTable();
        drawChartSubject();
        drawChartStudents();
    });

    function saveExcel() {
        // Преобразование данных студентов в массив объектов
        const studentsDataArray = Object.values(studentsData);
    
        // Создание новой рабочей книги
        const workbook = XLSX.utils.book_new();
    
        // Преобразование массива объектов в рабочий лист
        const worksheet = XLSX.utils.json_to_sheet(studentsDataArray);
    
        // Добавление рабочего листа в рабочую книгу
        XLSX.utils.book_append_sheet(workbook, worksheet, 'StudentsData');
    
        // Генерация файла Excel
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
        // Создание блоба из буфера
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
        // Создание URL для блоба
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
    
        a.href = url;
        a.download = 'studentsData.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    const savebtn = document.getElementById("saveOnFile");
    savebtn.addEventListener('click', saveExcel);

    // обновляем при загрузки старницы
    updateStatisticsTable();
    drawChartSubject();
    drawChartStudents();
});

// Функция для вычисления среднего значения
function calculateAverage(grades) {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc, val) => acc + val, 0);
    return sum / grades.length;
}

// Функция для вычисления медианы
function calculateMedian(grades) {
    if (grades.length === 0) return 0;
    const sortedGrades = grades.slice().sort((a, b) => a - b);
    const middleIndex = Math.floor(sortedGrades.length / 2);
    if (sortedGrades.length % 2 === 0) {
        return (sortedGrades[middleIndex - 1] + sortedGrades[middleIndex]) / 2;
    } else {
        return sortedGrades[middleIndex];
    }
}

// Функция для подсчета количества оценок каждого уровня
function countGradeOccurrences(grades) {
    const gradeCounts = {};

    grades.forEach(grade => {
        gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
    });

    return gradeCounts;
}

let statistics = {},
        classStatistics = {}, // Для хранения статистики по каждому классу и предмету
        totalStudentsCount = 0;

function updateStatisticsTable() {
    statistics = {}
    classStatistics = {};
    totalStudentsCount = 0;

    const statisticsTable = document.getElementById('statisticsTable');
    if (!statisticsTable) return;

    statisticsTable.innerHTML = `
        <tr>
            <th>Класс</th>
            <th>Предмет</th>
            <th>Средний балл</th>
            <th>Медиана</th>
            <th>Количество оценок</th>
        </tr>`;

    for (let student in studentsData){
        let studentClass = studentsData[student].class;
        totalStudentsCount++;
        for (let subject in studentsData[student]) {
            if (subject !== 'name' && subject !== 'class') {
                if (!statistics[subject]) {
                    statistics[subject] = {
                        average: 0,
                        count: 0,
                        grades: {}
                    };
                }
                if (!classStatistics[studentClass]) {
                    classStatistics[studentClass] = {};
                }
                if (!classStatistics[studentClass][subject]) {
                    classStatistics[studentClass][subject] = {
                        average: 0,
                        count: 0,
                        grades: {}
                    };
                }

                let grade = studentsData[student][subject];

                // Обновляем статистику для каждого класса и предмета
                statistics[subject].average += Number(grade);
                statistics[subject].count++;
                if (!statistics[subject].grades[grade]) {
                    statistics[subject].grades[grade] = 0;
                }
                statistics[subject].grades[grade]++;

                // Обновляем статистику для каждого класса и предмета
                classStatistics[studentClass][subject].average += Number(grade);
                classStatistics[studentClass][subject].count++;
                if (!classStatistics[studentClass][subject].grades[grade]) {
                    classStatistics[studentClass][subject].grades[grade] = 0;
                }
                classStatistics[studentClass][subject].grades[grade]++;
            }
        }
    }

    // Создаем строки для таблицы статистики №1
    for (let className in classStatistics) {
        for (let subject in classStatistics[className]) {
            const subjectInfo = classStatistics[className][subject];
            const averageGrade = subjectInfo.average / subjectInfo.count;
            const medianGrade = calculateMedian(Object.keys(subjectInfo.grades).map(parseFloat));
            const gradeCounts = subjectInfo.grades;
            const gradeCountsStr = Object.entries(gradeCounts)
                .map(([grade, count]) => {
                    const percentage = ((count / subjectInfo.count) * 100).toFixed(2);
                    return `${grade}: ${count} (${percentage}%)`;
                })
                .join(', ');

            // Добавляем строку в таблицу статистики
            statisticsTable.innerHTML += `
                <tr>
                    <td>${className}</td>
                    <td>${subject}</td>
                    <td>${averageGrade.toFixed(2)}</td>
                    <td>${medianGrade.toFixed(2)}</td>
                    <td>${gradeCountsStr}</td>
                </tr>`;
        }
    }

    for (let subject in statistics) {
        const subjectInfo = statistics[subject];
        const average = subjectInfo.average / subjectInfo.count;
        const mediana = calculateMedian(Object.keys(subjectInfo.grades).map(parseFloat))
        const gradeCounts = subjectInfo.grades;
        const gradeCountsStr = Object.entries(gradeCounts)
                .map(([grade, count]) => {
                    const percentage = ((count / subjectInfo.count) * 100).toFixed(2);
                    return `${grade}: ${count} (${percentage}%)`;
                })
                .join(', ');

        // Добавляем строку в таблицу статистики
        statisticsTable.innerHTML += `
        <tr>
            <td>ALL</td>
            <td>${subject}</td>
            <td>${average.toFixed(2)}</td>
            <td>${mediana.toFixed(2)}</td>
            <td>${gradeCountsStr}</td>
        </tr>`;
    }

    const studentsStatisticsTable = document.getElementById('studentsStatisticsTable');

    // Создаем заголовок таблицы
    studentsStatisticsTable.innerHTML = `
        <tr>
            <th>Имя ученика</th>
            <th>Предмет</th>
            <th>Средняя оценка</th>
            <th>Медиана</th>
            <th>Количество 5</th>
            <th>Количество 4</th>
            <th>Количество 3</th>
            <th>Количество 2</th>
            <th>Процент 5</th>
            <th>Процент 4</th>
            <th>Процент 3</th>
            <th>Процент 2</th>
        </tr>`;

    for (let studentName in studentsData) {
        let student = studentsData[studentName];

        for (let subject in student) {
            if (subject !== 'name' && subject !== 'class') {
                let grades = student[subject].split(',').map(Number); // Предполагается, что оценки хранятся в виде строки через запятую, преобразуем их в массив чисел
                let totalGrades = grades.length;

                let average = grades.reduce((acc, val) => acc + val, 0) / totalGrades;
                let median = calculateMedian(grades);

                let gradeCounts = {
                    5: grades.filter(g => g === 5).length,
                    4: grades.filter(g => g === 4).length,
                    3: grades.filter(g => g === 3).length,
                    2: grades.filter(g => g === 2).length
                };

                let gradePercentages = {
                    5: ((gradeCounts[5] / totalGrades) * 100).toFixed(2),
                    4: ((gradeCounts[4] / totalGrades) * 100).toFixed(2),
                    3: ((gradeCounts[3] / totalGrades) * 100).toFixed(2),
                    2: ((gradeCounts[2] / totalGrades) * 100).toFixed(2)
                };

                studentsStatisticsTable.innerHTML += `
                    <tr>
                        <td>${student.name}</td>
                        <td>${subject}</td>
                        <td>${average.toFixed(2)}</td>
                        <td>${median.toFixed(2)}</td>
                        <td>${gradeCounts[5]}</td>
                        <td>${gradeCounts[4]}</td>
                        <td>${gradeCounts[3]}</td>
                        <td>${gradeCounts[2]}</td>
                        <td>${gradePercentages[5]}%</td>
                        <td>${gradePercentages[4]}%</td>
                        <td>${gradePercentages[3]}%</td>
                        <td>${gradePercentages[2]}%</td>
                    </tr>`;
            }
        }
    }
}

let chartTable1,
    chartTable2,
    chartTable3

function drawChartSubject() {
    const ctxAverage = document.getElementById("chart-average").getContext('2d');
    const ctxMedian = document.getElementById("chart-median").getContext('2d');

    let colors = ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(153, 102, 255, 0.5)', 'rgba(255, 159, 64, 0.5)']; // Цвета для классов
    let colorIndex = 0;

    let datasetsAverage = [];
    let datasetsMedian = [];
    let subjects = new Set(); // Набор для уникальных предметов

    if (chartTable1 || chartTable2) {
        chartTable1.destroy();
        chartTable2.destroy();
    }

    console.log(classStatistics)

    // Собираем данные по классам и предметам
    for (let className in classStatistics) {
        let classData = classStatistics[className];
        
        for (let subject in classData) {
            subjects.add(subject);
            
            const subjectInfo = classData[subject];
            const averageGrade = subjectInfo.average / subjectInfo.count;
            const medianGrade = calculateMedian(Object.keys(subjectInfo.grades).map(parseFloat));
            
            // Данные для графика средних оценок
            let avgDataset = datasetsAverage.find(dataset => dataset.label === subject);
            if (!avgDataset) {
                avgDataset = {
                    label: subject,
                    data: [],
                    backgroundColor: colors[colorIndex % colors.length],
                    borderColor: colors[colorIndex % colors.length],
                    borderWidth: 1
                };
                datasetsAverage.push(avgDataset);
            }
            avgDataset.data.push(averageGrade);
            
            // Данные для графика медианных оценок
            let medianDataset = datasetsMedian.find(dataset => dataset.label === subject);
            if (!medianDataset) {
                medianDataset = {
                    label: subject,
                    data: [],
                    backgroundColor: colors[colorIndex % colors.length],
                    borderColor: colors[colorIndex % colors.length],
                    borderWidth: 1
                };
                datasetsMedian.push(medianDataset);
            }
            medianDataset.data.push(medianGrade);

            colorIndex++;
        }
    }

    const labels = Object.keys(classStatistics); // Классы для оси X

    // Создаем график средних оценок
    chartTable1 = new Chart(ctxAverage, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasetsAverage
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Средние оценки по классам и предметам'
                }
            }
        }
    });

    // Создаем график медианных оценок
    chartTable2 = new Chart(ctxMedian, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasetsMedian
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Медианные оценки по классам и предметам'
                }
            }
        }
    });
}

function drawChartStudents() {
    const ctxStudents = document.getElementById("studentGradesChart").getContext("2d");

    let labels = [];
    let datasets = [];

    if (chartTable3) {
        chartTable3.destroy()
    }

    // Extract labels (student names) dynamically
    for (let studentName in studentsData) {
        let student = studentsData[studentName];
        if (student.name) {
            labels.push(student.name);
        }
    }

    // Extract datasets
    for (let subject in studentsData[Object.keys(studentsData)[0]]) {
        if (subject !== "name" && subject !== "class") {
            let grades = [];
            for (let studentName in studentsData) {
                let student = studentsData[studentName];
                if (student.name) { // Ensure we skip any incomplete entries
                    grades.push(parseInt(student[subject]));
                }
            }
            datasets.push({
                label: subject,
                data: grades,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            });
        }
    }

    chartTable3 = new Chart(ctxStudents, {
        type: 'bar',
        data: {
            labels: labels, // Student names
            datasets: datasets // Subjects and their grades
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Статистика учеников'
                }
            }
        }
    });
}

function view(el) {
    let elements = document.querySelectorAll('.content > div');
    for (let i = 0; i < elements.length; i++) {
        elements[i].style.display = 'none';
    }
    document.getElementById(el).style.display = 'block';

    // Если отображается вкладка "Статистика (Графическая)", добавляем кнопку для построения графика
    if (el === 'graphStatistics') {
        let graphButton = document.getElementById('graphButton');
        if (!graphButton) {
            graphButton = document.createElement('button');
            graphButton.textContent = 'Построить график';
            graphButton.onclick = drawChart;
            graphButton.id = 'graphButton';
            document.getElementById(el).appendChild(graphButton);
        }
    } else {
        let graphButton = document.getElementById('graphButton');
        if (graphButton) {
            graphButton.remove();
        }
    }
}

// Меню
function openTab(evt, tabName) {
    // Скрыть все вкладки
    var tabContent = document.getElementsByClassName('tab-content');
    for (var i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = 'none';
    }

    // Удалить активный класс у всех вкладок
    var tabButtons = document.getElementsByClassName('tab-button');
    for (var i = 0; i < tabButtons.length; i++) {
        tabButtons[i].className = tabButtons[i].className.replace(' active', '');
    }

    // Показать выбранную вкладку и добавить активный класс кнопке
    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.className += ' active';
}
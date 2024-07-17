const API_URL = "http://localhost:3000/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;

let categories = [];

async function getCategoryIds() {
  // ask for 100 categories [most we can ask for], so we can pick random
  let response = await axios.get(`${API_URL}categories`, {
    params: { count: 100 }
  });
  let catIds = response.data.map(c => c.id);   // create a new array catIds is an array of all the Ids 
  return _.sampleSize(catIds, NUM_CATEGORIES);
}

async function getCategory(catId) {
  let response = await axios.get(`${API_URL}category`, {
    params: { id: catId }
  });
  let cat = response.data;
  let randomArray = _.sampleSize(cat.clues, NUM_CLUES_PER_CAT)
    .map(c => ({
      question: c.question,
      answer: c.answer,
      showing: null
    }));
  return { title: cat.title, clues: randomArray };
}


async function fillTable() {
  hideLoadingView();
  $('#gameContainer').empty();

  let table = $('<table>').addClass('jeopardyTable');
  let tableHead = $("<thead>");
  let tableBody = $("<tbody>");
  let headerRow = $("<tr>").addClass('jeopardyHeader');

  for (let cat of categories) {
    let tableHeaders = $('<th>').text(cat.title);  // creating a th for each category
    headerRow.append(tableHeaders);
  }
  tableHead.append(headerRow);  // appending headerRow into thead and thead into the main table

  for (let i = 0; i < NUM_CLUES_PER_CAT; i++) {
    let row = $("<tr>").addClass('jeopardyBody');
    for (let j = 0; j < categories.length; j++) {
      let cell = $('<td>').attr('id', `${j}-${i}`).text('?');
      row.append(cell);
    }
    tableBody.append(row);
  }

  table.append(tableHead).append(tableBody);
  $('#gameContainer').append(table);
}


function handleClick(evt) {
  let cell = $(evt.target);
  let id = cell.attr('id');

  let [catIdx, clueIdx] = id.split('-')
  let clue = categories[catIdx].clues[clueIdx];
  console.log(catIdx,clueIdx)
  if (!clue) {
    console.log('Invalid clue:', catIdx, clueIdx);
    return;
  }

  if (clue.showing === null) {
    cell.text(clue.question);
    clue.showing = "question";
  } else if (clue.showing === "question") {
    cell.text(clue.answer);
    clue.showing = "answer";
    cell.addClass('disabled');
  }
}


function showLoadingView() {
  $("#loadingSpinner").show();
}

// /** Remove the loading spinner and update the button used to fetch data. */
function hideLoadingView() {
  $('#tableBody').empty();
  $("#loadingSpinner").hide();
}


async function setupAndStart() {
  showLoadingView();
  let categoryIds = await getCategoryIds();

  for (let catId of categoryIds) {
    let categoryData = await getCategory(catId);
    categories.push(categoryData);
  }
  fillTable();
  hideLoadingView();
}



$(document).ready(function() {
  // Create start button
  let startButton = $("<button id='start'>Start Game</button>");  //creating a start button
  let restartButton = $("<button id='restart'>Restart Game</button>")

  $('body').append(startButton); // appending the button to the gameContainer
  $('body').append(restartButton)
  $('.jeopardyTable').hide();
  restartButton.hide();
  $('#start').on('click', function() {
   
    $("#start").hide();
    setupAndStart();
    restartButton.show();
  });

  $('#gameContainer').on('click', 'td', handleClick); // handleClick evt listener adding td to make sure if they click th it wont change the text
  $('#restart').on('click',function(){
    $('.jeopardyTable').empty();
     categories =[];  // reset categories when user presses on restart
     setupAndStart();
  })
});
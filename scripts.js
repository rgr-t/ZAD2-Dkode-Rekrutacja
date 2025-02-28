//current calculator state
var state = {
  currentResult: 0,
  inOperationState: false,
  operationValues: {
    first: null, //left number
    second: null, //right number
    operationType: null,
  },
  currencyValues: {
    currentCurrency: "PLN",
    currencyRate: 1,
  },
};

var logsArea = $(".textareaha");

/*

functions

*/

//operation (+ - * /) buttons handling function
function Operation(currentOperation) 
{
  //if it's already in operation state, just change type of operation
  if (state.inOperationState && state.operationValues.second == null) 
  {
    if (state.operationValues.first.endsWith("."))           
      RemoveFloatingPointFromFirstValue();
        
    state.operationValues.operationType = currentOperation;
    ViewDisplayCurrentState();
  }  
  //else, start operation
  else if (!state.inOperationState) 
    {
      if (state.currentResult.endsWith("."))
        RemoveFloatingPointFromFirstValue();

    state.inOperationState = true;
    state.operationValues.first = state.currentResult;
    state.operationValues.operationType = currentOperation;
    ViewDisplayCurrentState();
  }
}

//floating point hangling function
function AddFloatingPoint() 
{
  if (!state.inOperationState) 
  {
    if (!state.currentResult.includes(".")) 
      state.currentResult += ".";    
  }
  else 
  {
    if (state.operationValues.second == null) 
      state.operationValues.second = "0.";
    else 
    {
      if (!state.operationValues.second.includes(".")) 
        state.operationValues.second += ".";      
    }
  }
  ViewDisplayCurrentState();
}

// = button handling function with some mathematical calculations
function EndOperation() 
{
  if (state.inOperationState) 
  {
    if (state.operationValues.second == null) 
    {
      state.inOperationState = false;
      state.currentResult = state.operationValues.first;
      state.operationValues.first = null;
      state.operationValues.operationType = null;
    } 
    else 
    {
      if (state.operationValues.second.endsWith(".")) 
      {
        RemoveFloatingPointFromSecondValue();
        RemoveFloatingPointFromFirstValue();
      }

      var firstFloatNumber = parseFloat(state.operationValues.first);
      var secondFloatNumber = parseFloat(state.operationValues.second);
      var result = 0;

      switch (state.operationValues.operationType) {
        case "+": 
        {
          result = firstFloatNumber + secondFloatNumber;
          break;
        }
        case "-": 
        {
          result = firstFloatNumber - secondFloatNumber;
          break;
        }
        case "*": 
        {
          result = firstFloatNumber * secondFloatNumber;
          break;
        }
        case "/": 
        {
          if (secondFloatNumber != 0)           
            result = firstFloatNumber / secondFloatNumber;

          else 
          {
            alert("you can't divide by zero");
            result = 0;
          }
          break;
        }
      }

      state.operationValues.first = null;
      state.operationValues.operationType = null;
      state.operationValues.second = null;

      Restart();
      
      state.currentResult = result.toString();
    }
  }

  ViewDisplayCurrentState();
}

//function for refreshing result input value
function ViewDisplayCurrentState() 
{  
  if (!state.inOperationState)
    $("#result").val(state.currentResult);
  else 
  {
    if (state.operationValues.second == null)
      $("#result").val(`${state.operationValues.first} ${state.operationValues.operationType} `);
    else 
      $("#result").val(`${state.operationValues.first} ${state.operationValues.operationType} ${state.operationValues.second}`);    
  }
}

//nbp api call function with some validation, depends on what currency we chose
function CallNbpApi(currency) 
{
  if (state.currencyValues.currentCurrency != currency) 
  {    
    var apiUrl = `https://api.nbp.pl/api/exchangerates/rates/a/${currency}/2025-02-03?format=json`;
    var currencyValue = null;

    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => 
        {
          currencyValue = data.rates[0].mid;

          if (currencyValue != null)           
            ConvertCurrency(currencyValue, currency);
          
        })
      .catch(() => console.log("api is dead or smth"));
  } 
  else 
  {
    CountCurrencyBackToPLN();
    ViewDisplayCurrentState();
    LogInfo(`Current currency: ${state.currencyValues.currentCurrency}`);
  }
}

//main currency converting function
function ConvertCurrency(currencyValue, newCurrencyType) 
{
  if (state.currencyValues.currentCurrency == "PLN") 
  {
    if (!state.inOperationState) 
    {
      if (state.currentResult.endsWith("."))
        RemoveFloatingPointFromFirstValue();

      var currentResultFloat = parseFloat(state.currentResult);

      currentResultFloat /= currencyValue;
      state.currentResult = currentResultFloat.toFixed(2).toString();
      state.currencyValues.currencyRate = currencyValue;
      state.currencyValues.currentCurrency = newCurrencyType;
    } 
    else 
    {
      if (state.operationValues.second != null) 
      {
        if (state.operationValues.second.endsWith("."))
          RemoveFloatingPointFromSecondValue();

        var firstFloatNumber = parseFloat(state.operationValues.first);
        var secondFloatNumber = parseFloat(state.operationValues.second);
        var currentResultFloat = parseFloat(state.currentResult);

        firstFloatNumber /= currencyValue;
        state.operationValues.first = firstFloatNumber.toFixed(2).toString();
        secondFloatNumber /= currencyValue;
        state.operationValues.second = secondFloatNumber.toFixed(2).toString();        
        currentResultFloat /= currencyValue;
        state.currentResult = currentResultFloat.toFixed(2).toString();
        state.currencyValues.currencyRate = currencyValue;
        state.currencyValues.currentCurrency = newCurrencyType;
      }
    }

    ViewDisplayCurrentState();
    LogInfo(`Current currency: ${state.currencyValues.currentCurrency}`);
  } 
  else 
  {
    CountCurrencyBackToPLN();
    CallNbpApi(newCurrencyType);
  }
}

//currency converting function from some other to PLN
function CountCurrencyBackToPLN() 
{
  if (!state.inOperationState) 
  {
    if (state.currentResult.endsWith(".")) 
      RemoveFloatingPointFromFirstValue();

    var currentResultFloat = parseFloat(state.currentResult);

    currentResultFloat *= state.currencyValues.currencyRate;
    state.currentResult = currentResultFloat.toFixed(2).toString();
    state.currencyValues.currencyRate = 1;
    state.currencyValues.currentCurrency = "PLN";

  } 
  else 
  {
    if (state.operationValues.second != null) 
    {
      if (state.operationValues.second.endsWith("."))
        RemoveFloatingPointFromSecondValue();

      var firstFloatNumber = parseFloat(state.operationValues.first);
      var secondFloatNumber = parseFloat(state.operationValues.second);
      var currentResultFloat = parseFloat(state.currentResult);

      firstFloatNumber *= state.currencyValues.currencyRate;
      state.operationValues.first = firstFloatNumber.toFixed(2).toString();
      secondFloatNumber *= state.currencyValues.currencyRate;
      state.operationValues.second = secondFloatNumber.toFixed(2).toString();      
      currentResultFloat *= state.currencyValues.currencyRate;
      state.currentResult = currentResultFloat.toFixed(2).toString();
      state.currencyValues.currencyRate = 1;
      state.currencyValues.currentCurrency = "PLN";
    }
  }
}

//helper functions to make less mess in code with removing some unwanted '.' at the end of number
function RemoveFloatingPointFromFirstValue() 
{
  state.currentResult = state.currentResult.slice(0, -1);
}

function RemoveFloatingPointFromSecondValue() 
{
  state.operationValues.second = state.operationValues.second.slice(0, -1);
}

// Logs info to history logs area
function LogInfo(info) 
{
  var currentLogs = logsArea.val();

  logsArea.val(currentLogs + "\n" + info);
}

// Restart whole calculator state
function Restart() 
{
  state.currentResult = 0;
  state.inOperationState = false;
  state.operationValues.first = null;
  state.operationValues.operationType = null;
  state.operationValues.second = null;

  ViewSetResultInputToZero();
}

// Set input field text to "0"
function ViewSetResultInputToZero() 
{
  $("#result").val("0");
}

/*

// on click events section

*/

//number buttons events:
$(".number-input").each(function () 
{
  $(this).on("click", function () 
  {
    var clickedValue = this.value;

    if (!state.inOperationState) 
    {
      if (state.currentResult != "0") 
        state.currentResult += clickedValue;
      else       
        state.currentResult = clickedValue;      
    } 
    else 
    {
      if (state.operationValues.second != null && state.operationValues.second != "0")       
        state.operationValues.second += clickedValue;
      else if (state.operationValues.second == null)
        state.operationValues.second = clickedValue;
    }

    ViewDisplayCurrentState();
  });
});

//operation buttons events:
$(".operation").each(function () 
{
  $(this).on("click", function () 
  {
    Operation(this.value);
  });
});

//other buttons events:
$("#floating").on("click", function () 
{
  AddFloatingPoint();
});

$("#restart").on("click", function () 
{
  Restart();
});

$("#equal").on("click", function () 
{
  EndOperation();
});

$("#GBP").on("click", function () 
{
  CallNbpApi("GBP");
});

$("#EUR").on("click", function () 
{
  CallNbpApi("EUR");
});

$("#USD").on("click", function () 
{
  CallNbpApi("USD");
});
const fs = require("fs");
const pdf = require("pdf-parse"); //  ei module install dite hobe 'npm i pdf-parse'

const pdfPath = "./PhonePe_Statement_Jun2023_Jun2024.pdf";
let dataBuffer = fs.readFileSync(pdfPath);


// contants
const deletableLineTexts = [
  "Page ",
  "This is a system generated statement.",
  "DateTransaction ",
  "Transaction Statement for ",
  " Prepaid Reference ID ",
  "UTR No. ",
]; // this are the texts that should be deleted from the text
const destruceturables = [
  "₹",
  "Mobile recharged ",
  "Received from ",
  "Paid to ",
  "Transfer to ",
  "Credit card Authentication ",
]; // this are the texts that are uased to destructure the one line text into multiple to extract datas from the text

// functionalities
// this is a function that takes a text and destructure it into multiple parts based on the destruceturables
const deStructureText = (text) => {
  destruceturables.forEach((item) => {
    text = text.replace(new RegExp(item), "-");
  });
  return text.split("-");
};
pdf(dataBuffer).then(function (data) {
  const text = data?.text
    ?.split("\n") // split by new line
    ?.filter(
      (line) =>
        !deletableLineTexts.some((txt) => {
          return line.includes(txt);
        }) && line !== ""
    ) // deletable line should be deleted/excluded ans also empty lines
    ?.slice(1) // remove the first line
    ?.slice(0, -7); //  delete the last 7 unneccessary lines

  let transactions = [];

  for (let i = 0; i < text.length && i + 6 < text.length; i += 6) {
    let date = new Date(text[i] + " " + text[i + 1]).getTime();
    const [trxType, amount, cell] = deStructureText(text[i + 2]);
    const trxId = text[i + 3].replace("Transaction ID ", "");
    const creditedTo = text[i + 5];
    transactions.push({
      date,
      trxType,
      amount: `₹${amount}`,
      cell,
      trxId,
      creditedTo,
    });
  }
  console.log({
    transactions,
  });
  let jsonData = JSON.stringify(transactions, null, 4);

  fs.writeFileSync("transactions.json", jsonData);
});

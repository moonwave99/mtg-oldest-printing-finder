const form = document.querySelector("form");
const submitButton = form.querySelector('[type="submit"]');
const copyButton = form.querySelector('[data-action="copy"]');

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  const list = parseList(event.target.list.value);
  const resp = await mapSeries(list, request);
  event.target.output.value = resp.filter((x) => !!x).join("\n");
  submitButton.disabled = false;
  copyButton.disabled = false;
});

copyButton.addEventListener("click", async () => {
  const list = form.output.value;
  if (!list) {
    return;
  }
  await navigator.clipboard.writeText(list);
  copyButton.innerHTML = "Copied!";
  copyButton.disabled = true;
  setTimeout(() => {
    copyButton.innerHTML = "Copy";
    copyButton.disabled = false;
  }, 1000);
});

async function mapSeries(array, callback) {
  if (!array.length) {
    return [];
  }
  return new Promise((resolve) => {
    const output = [];
    async function invoke(index) {
      const result = await callback(array[index], index);
      output.push(result);
      output.length === array.length ? resolve(output) : invoke(output.length);
    }
    invoke(0);
  });
}

function parseList(list) {
  return list
    .split("\n")
    .filter(
      (x) => x && x.replace("and", "") !== x.replace("and", "").toUpperCase(),
    )
    .map((line) => line.match(/(\d{1,2}) (.*)/).slice(1, 3));
}

const multipleLayouts = ["adventure", "transform", "modal_dfc"];

async function request([quantity, name]) {
  const response = await fetch(
    `https://api.scryfall.com/cards/search?${new URLSearchParams({
      q: name,
      order: "released",
      dir: "asc",
      unique: "prints",
    })}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "mtg-list",
      },
    },
  );
  const data = await response.json();
  const result = data.data.find((x) =>
    multipleLayouts.includes(x.layout)
      ? x.name.startsWith(name)
      : x.name === name,
  );
  if (!result) {
    return null;
  }
  const { set, collector_number } = result;
  return `${quantity} ${name} (${set.toUpperCase()}) ${collector_number}`;
}

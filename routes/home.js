const csv = require("csvtojson");
const rootDir = require("./root");
const path = require("path");
const fs = require("fs");
const { hostname } = require("os");
const router = require("express").Router();

const pokemonTypes = [
  "bug",
  "dragon",
  "fairy",
  "fire",
  "ghost",
  "ground",
  "normal",
  "psychic",
  "steel",
  "dark",
  "electric",
  "fighting",
  "flyingText",
  "grass",
  "ice",
  "poison",
  "rock",
  "water",
];

const init = async () => {
  const csvFilePath = path.join(rootDir, "pokemon.csv");
  let pokemonsData = await csv().fromFile(csvFilePath);

  const pokemonImgFiles = path.join(rootDir, "public", "pokemon_images");
  const pokemonImages = fs
    .readdirSync(pokemonImgFiles)
    .map((image) => image.split(".")[0]);

  pokemonsData = pokemonsData.map((pokemon, index) => {
    if (pokemonImages.includes((index + 1).toString())) {
      return {
        id: index + 1,
        name: pokemon.Name,
        types: pokemon.Type2
          ? [pokemon.Type1.toLowerCase(), pokemon.Type2.toLowerCase()]
          : [pokemon.Type1.toLowerCase()],
        url: `https://raw.githubusercontent.com/lephuthuc2001/pokemon_be/main/public/pokemon_images/${
          index + 1
        }.jpg`,
      };
    }
  });

  pokemonsData = pokemonsData.filter((pokemon) => !!pokemon);

  const dbPath = path.join(rootDir, "pokemons.json");

  fs.writeFileSync(
    dbPath,
    JSON.stringify({
      data: pokemonsData,
      totalPokemons: pokemonsData.length,
    })
  );

  return fs.readFileSync(dbPath, {
    encoding: "utf8",
  });
};

const getDataFromDb = () => {
  const dbPath = path.join(rootDir, "pokemons.json");

  return fs.readFileSync(dbPath, {
    encoding: "utf8",
  });
};

router.get("/:pokemonId", async function (req, res, next) {
  let pokemonsData = getDataFromDb();

  if (!pokemonsData) {
    pokemonsData = await init();
  }

  pokemonsData = JSON.parse(pokemonsData);

  //// get pokemon by ID

  const pokemonId = parseInt(req.params.pokemonId);

  const previousPokemonId =
    pokemonId === 1 ? pokemonsData.data.length : pokemonId - 1;

  const nextPokemonId =
    pokemonId === pokemonsData.data.length ? 1 : pokemonId + 1;

  const result = {
    pokemon: pokemonsData.data.find((pokemon) => pokemon.id === pokemonId),
    nextPokemon: pokemonsData.data.find(
      (pokemon) => pokemon.id === nextPokemonId
    ),
    previousPokemon: pokemonsData.data.find(
      (pokemon) => pokemon.id === previousPokemonId
    ),
  };
  res.send({ data: result });
});

router.get("/", async function (req, res, next) {
  let pokemonsData = getDataFromDb();

  if (!pokemonsData) {
    pokemonsData = await init();
  }
  pokemonsData = JSON.parse(pokemonsData);

  ///Search with query
  let result = pokemonsData.data;

  const { page, limit, search, type } = req.query;

  /// type
  if (type) {
    result = result.filter((pokemon) => pokemon.types.includes(type) === true);
  }
  ///search
  if (search) {
    result = result.filter((pokemon) => pokemon.name.toLowerCase() === search);
  }
  //page
  result = result.slice(limit * (page - 1), limit * page);

  res.send({
    data: result,
  });
});

module.exports = router;

#! /usr/bin/env node
import { program } from "commander";
import {
  generateAlerts,
  deleteAllAlerts,
  deleteAllEvents,
  generateGraph,
  generateEvents,
} from "./commands/documents.mjs";
import { fetchRiskScore } from "./commands/api.mjs";
import {
  cleanEntityStore,
  generateEntityStore,
} from "./commands/entity-store.mjs";
import config from "./config.json" assert { type: "json" };
import inquirer from "inquirer";
import { ENTITY_STORE_OPTIONS } from "./constants.mjs";

const withEsValidation =
  (fn) =>
  (...args) => {
    if (!config.elastic.node) {
      return console.log("Please provide elastic node in config.json");
    }
    const hasApiKey = config.elastic.apiKey;
    const hasPassword = config.elastic.username && config.elastic.password;
    if (!hasApiKey && !hasPassword) {
      console.log(
        "Please provide elastic apiKey or username/password in config.json"
      );
      return;
    }
    return fn(...args);
  };

const withKibanaValidation =
  (fn) =>
  (...args) => {
    if (!config.kibana.node) {
      return console.log("Please provide kibana node in config.json");
    }
    const hasPassword = config.kibana.username && config.kibana.password;
    if (!hasPassword) {
      console.log(
        "Please provide elastic apiKey or username/password in config.json"
      );
      return;
    }
    return fn(...args);
  };

program
  .command("generate-alerts")
  .argument("<n>", "integer argument", parseInt)
  .description("Generate fake alerts")
  .action(withEsValidation(generateAlerts));

program
  .command("generate-events")
  .argument("<n>", "integer argument", parseInt)
  .description("Generate events")
  .action(withEsValidation(generateEvents));

program
  .command("generate-graph")
  // .argument('<n>', 'integer argument', parseInt)
  .description("Generate fake graph")
  .action(withEsValidation(generateGraph));

program
  .command("delete-alerts")
  .description("Delete all alerts")
  .action(withEsValidation(deleteAllAlerts));

program
  .command("delete-events")
  .description("Delete all events")
  .action(withEsValidation(deleteAllEvents));

program
  .command("test-risk-score")
  .description("Test risk score API")
  .action(withEsValidation(fetchRiskScore));

program
  .command("entity-store")
  .description("Generate entity store")
  .action(
    withKibanaValidation(
      withEsValidation(() => {
        inquirer
          .prompt([
            {
              type: "checkbox",
              message: "Select options",
              name: "options",
              choices: [
                {
                  name: "Seed (stable random data)",
                  value: ENTITY_STORE_OPTIONS.seed,
                  checked: true,
                },
                {
                  name: "Assign asset criticality",
                  value: ENTITY_STORE_OPTIONS.criticality,
                  checked: true,
                },
                {
                  name: "Enable Risk Engine",
                  value: ENTITY_STORE_OPTIONS.riskEngine,
                  checked: true,
                },
                {
                  name: "Create detection rule",
                  value: ENTITY_STORE_OPTIONS.rule,
                  checked: true,
                },
              ],
            },
            {
              type: 'input',
              name: 'users',
              message: "How many users",
              default() {
                return 10;
              },
            },
            {
              type: 'input',
              name: 'hosts',
              message: "How many hosts",
              default() {
                return 10;
              },
            },
          ])
          .then((answers) => {
            const users = parseInt(answers.users);
            const hosts = parseInt(answers.hosts);
            generateEntityStore({
              users,
              hosts,
              options: answers.options,
            });
          });
      })
    )
  );

cleanEntityStore;

program
  .command("clean-entity-store")
  .description("Generate entity store")
  .action(withKibanaValidation(withEsValidation(cleanEntityStore)));

program.parse();

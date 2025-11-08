import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Counter (Verbose)", function () {
  it("Should emit the Increment event when calling the inc() function", async function () {
    console.log("\n📦 Desplegando Counter...");
    const counter = await ethers.deployContract("Counter");
    const address = await counter.getAddress();
    console.log(`✅ Counter desplegado en: ${address}`);
    
    console.log("\n🔢 Valor inicial de x:", await counter.x());
    
    console.log("⚡ Llamando a inc()...");
    const tx = await counter.inc();
    await tx.wait();
    
    console.log("🔢 Nuevo valor de x:", await counter.x());
    
    await expect(counter.inc()).to.emit(counter, "Increment").withArgs(1n);
  });

  it("The sum of the Increment events should match the current value", async function () {
    console.log("\n📦 Desplegando Counter...");
    const counter = await ethers.deployContract("Counter");
    const address = await counter.getAddress();
    console.log(`✅ Counter desplegado en: ${address}`);
    
    const deploymentBlockNumber = await ethers.provider.getBlockNumber();
    console.log(`📍 Bloque de despliegue: ${deploymentBlockNumber}`);

    // run a series of increments
    console.log("\n⚡ Ejecutando incrementos...");
    for (let i = 1; i <= 10; i++) {
      const tx = await counter.incBy(i);
      await tx.wait();
      const currentValue = await counter.x();
      console.log(`  incBy(${i}) → x = ${currentValue}`);
    }

    const events = await counter.queryFilter(
      counter.filters.Increment(),
      deploymentBlockNumber,
      "latest",
    );

    console.log(`\n📊 Total de eventos Increment: ${events.length}`);
    
    // check that the aggregated events match the current value
    let total = 0n;
    for (const event of events) {
      console.log(`  Evento: Increment(${event.args.by})`);
      total += event.args.by;
    }

    const finalValue = await counter.x();
    console.log(`\n🎯 Suma de eventos: ${total}`);
    console.log(`🎯 Valor final de x: ${finalValue}`);
    
    expect(finalValue).to.equal(total);
    console.log("✅ ¡Los valores coinciden!");
  });
});

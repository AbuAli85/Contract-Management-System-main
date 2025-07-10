async function analyzeScenarioLogs() {
  const csvUrl =
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/scenario-5660007-logs-r80j0nh2eocv1rJpNO6YDxMzCCkRfV.csv"
  const schema = [
    { name: "id", type: "string" },
    { name: "timestamp", type: "date" },
    { name: "authorId", type: "string" },
    { name: "statusId", type: "number" }, // Corrected based on example
    { name: "statusLabel", type: "string" },
    { name: "instant", type: "string" }, // boolean as string
    { name: "type", type: "string" },
    { name: "operations", type: "number" }, // Corrected based on example
    { name: "transfer", type: "number" }, // Corrected based on example
    { name: "duration", type: "number" }, // Corrected based on example
    { name: "executionDetailLink", type: "string" },
  ]

  try {
    console.log(`Fetching CSV data from ${csvUrl}...`)
    const response = await fetch(csvUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`)
    }
    const csvText = await response.text()
    console.log("CSV data fetched successfully.\n")

    const lines = csvText.trim().split("\n")
    if (lines.length <= 1) {
      console.log("No data rows found in the CSV.")
      return
    }

    const header = lines[0].split(",").map((h) => h.trim())
    const dataRows = lines.slice(1)

    const parsedData = dataRows
      .map((line, rowIndex) => {
        const values = line.split(",")
        const entry = {}
        if (values.length !== header.length) {
          // console.warn(`Row ${rowIndex + 1} has ${values.length} columns, expected ${header.length}. Skipping.`);
          // For this dataset, it seems the last column (link) might contain commas.
          // A more robust CSV parser would handle this. For now, we'll join the remainder for the last field.
          const fixedValues = line.split(",", header.length - 1)
          if (values.length >= header.length) {
            fixedValues.push(values.slice(header.length - 1).join(","))
          } else {
            // If still not enough, pad with empty strings
            for (let i = values.length; i < header.length; i++) fixedValues.push("")
          }
          header.forEach((colName, index) => {
            entry[colName.trim()] = fixedValues[index] ? fixedValues[index].trim() : ""
          })
        } else {
          header.forEach((colName, index) => {
            entry[colName.trim()] = values[index] ? values[index].trim() : ""
          })
        }

        // Type conversion based on schema (simplified)
        if (entry.duration) entry.duration = Number.parseInt(entry.duration, 10)
        if (entry.operations) entry.operations = Number.parseInt(entry.operations, 10)
        if (entry.transfer) entry.transfer = Number.parseInt(entry.transfer, 10)
        if (entry.timestamp) entry.timestamp = new Date(entry.timestamp)
        return entry
      })
      .filter((entry) => Object.keys(entry).length > 0) // Filter out skipped rows

    console.log("--- Data Analysis Results ---")
    console.log(`Total log entries: ${parsedData.length}`)

    // Status Label counts
    const statusCounts = parsedData.reduce((acc, curr) => {
      acc[curr.statusLabel] = (acc[curr.statusLabel] || 0) + 1
      return acc
    }, {})
    console.log("\nLogs by Status Label:")
    for (const status in statusCounts) {
      console.log(`- ${status}: ${statusCounts[status]}`)
    }

    // Average duration
    const validDurations = parsedData.filter(
      (e) => typeof e.duration === "number" && !isNaN(e.duration),
    )
    const totalDuration = validDurations.reduce((sum, e) => sum + e.duration, 0)
    const averageDuration =
      validDurations.length > 0 ? (totalDuration / validDurations.length).toFixed(2) : "N/A"
    console.log(`\nAverage Duration: ${averageDuration} (units depend on source, likely ms or s)`)

    // Type counts
    const typeCounts = parsedData.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1
      return acc
    }, {})
    console.log("\nLogs by Type:")
    for (const type in typeCounts) {
      console.log(`- ${type}: ${typeCounts[type]}`)
    }

    // Unique Author IDs
    const uniqueAuthorIds = new Set(parsedData.map((e) => e.authorId))
    console.log(`\nNumber of Unique Author IDs: ${uniqueAuthorIds.size}`)

    // Timestamp range
    const timestamps = parsedData
      .map((e) => e.timestamp)
      .filter((t) => t instanceof Date && !isNaN(t.valueOf()))
      .sort((a, b) => a - b)

    if (timestamps.length > 0) {
      const earliestTimestamp = timestamps[0].toISOString()
      const latestTimestamp = timestamps[timestamps.length - 1].toISOString()
      console.log("\nTimestamp Range:")
      console.log(`- Earliest: ${earliestTimestamp}`)
      console.log(`- Latest:   ${latestTimestamp}`)
    } else {
      console.log("\nTimestamp Range: No valid timestamps found.")
    }

    // Example: Top 5 longest duration logs
    const top5Longest = parsedData
      .filter((e) => typeof e.duration === "number" && !isNaN(e.duration))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
    console.log("\nTop 5 Longest Duration Logs (id, duration, statusLabel):")
    top5Longest.forEach((log) => {
      console.log(`- ID: ${log.id}, Duration: ${log.duration}, Status: ${log.statusLabel}`)
    })

    // --- Detailed Error Analysis ---
    console.log("\n\n--- Detailed Error Analysis ---")
    const errorLogs = parsedData.filter((log) => log.statusLabel === "error")

    if (errorLogs.length === 0) {
      console.log("No error logs found to analyze.")
    } else {
      console.log(`Total error logs: ${errorLogs.length}`)

      // Errors by Type
      const errorsByType = errorLogs.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1
        return acc
      }, {})
      console.log("\nErrors by Type:")
      for (const type in errorsByType) {
        console.log(`- ${type}: ${errorsByType[type]}`)
      }

      // Errors by Author ID
      const errorsByAuthor = errorLogs.reduce((acc, curr) => {
        acc[curr.authorId] = (acc[curr.authorId] || 0) + 1
        return acc
      }, {})
      console.log("\nErrors by Author ID:")
      for (const authorId in errorsByAuthor) {
        console.log(`- Author ${authorId}: ${errorsByAuthor[authorId]}`)
      }

      // Duration statistics for errors
      const errorDurations = errorLogs
        .map((log) => log.duration)
        .filter((d) => typeof d === "number" && !isNaN(d))
      if (errorDurations.length > 0) {
        const avgErrorDuration = (
          errorDurations.reduce((sum, d) => sum + d, 0) / errorDurations.length
        ).toFixed(2)
        const minErrorDuration = Math.min(...errorDurations)
        const maxErrorDuration = Math.max(...errorDurations)
        console.log("\nDuration of Error Logs:")
        console.log(`- Average: ${avgErrorDuration}`)
        console.log(`- Minimum: ${minErrorDuration}`)
        console.log(`- Maximum: ${maxErrorDuration}`)
      } else {
        console.log("\nDuration of Error Logs: No valid duration data for errors.")
      }

      // Operations statistics for errors
      const errorOperations = errorLogs
        .map((log) => log.operations)
        .filter((op) => typeof op === "number" && !isNaN(op))
      if (errorOperations.length > 0) {
        const avgErrorOps = (
          errorOperations.reduce((sum, op) => sum + op, 0) / errorOperations.length
        ).toFixed(2)
        const minErrorOps = Math.min(...errorOperations)
        const maxErrorOps = Math.max(...errorOperations)
        console.log("\nOperations in Error Logs:")
        console.log(`- Average: ${avgErrorOps}`)
        console.log(`- Minimum: ${minErrorOps}`)
        console.log(`- Maximum: ${maxErrorOps}`)
      } else {
        console.log("\nOperations in Error Logs: No valid operations data for errors.")
      }

      // Transfer statistics for errors
      const errorTransfers = errorLogs
        .map((log) => log.transfer)
        .filter((t) => typeof t === "number" && !isNaN(t))
      if (errorTransfers.length > 0) {
        const avgErrorTransfer = (
          errorTransfers.reduce((sum, t) => sum + t, 0) / errorTransfers.length
        ).toFixed(2)
        const minErrorTransfer = Math.min(...errorTransfers)
        const maxErrorTransfer = Math.max(...errorTransfers)
        console.log("\nData Transferred in Error Logs (KB):")
        console.log(`- Average: ${avgErrorTransfer}`)
        console.log(`- Minimum: ${minErrorTransfer}`)
        console.log(`- Maximum: ${maxErrorTransfer}`)
      } else {
        console.log("\nData Transferred in Error Logs: No valid transfer data for errors.")
      }

      // Error Timestamps - Hourly distribution
      const errorTimestamps = errorLogs
        .map((log) => log.timestamp)
        .filter((t) => t instanceof Date && !isNaN(t.valueOf()))

      if (errorTimestamps.length > 0) {
        const errorsByHour = errorTimestamps.reduce((acc, curr) => {
          const hour = curr.getUTCHours() // Using UTC hours
          acc[hour] = (acc[hour] || 0) + 1
          return acc
        }, {})
        console.log("\nError Distribution by Hour of Day (UTC):")
        for (let hour = 0; hour < 24; hour++) {
          if (errorsByHour[hour]) {
            console.log(
              `- Hour ${String(hour).padStart(2, "0")}:00 - ${String(hour).padStart(2, "0")}:59 : ${errorsByHour[hour]} errors`,
            )
          }
        }
      }

      // Example Error Log Links for direct investigation
      console.log("\nExample Error Log Links (up to 5):")
      errorLogs.slice(0, 5).forEach((log, index) => {
        console.log(`- Example ${index + 1}: ${log.executionDetailLink}`)
      })
    }
    // End of new error analysis section
  } catch (error) {
    console.error("Error during CSV analysis:", error)
  }
}

analyzeScenarioLogs()

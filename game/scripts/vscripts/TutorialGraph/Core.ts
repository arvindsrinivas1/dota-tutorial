/**
 * Shared context in a tutorial graph.
 */
export type TutorialContext = {
    [key: string]: any
}

/**
 * Node in the tutorial graph. Can be composed with tutStep and tutFork to build
 * a tutorial graph.
 */
export type TutorialStep = {
    /**
     * Called when the step is started. Should call complete when the step is done. Can use context to share data with other steps.
     */
    start: (context: TutorialContext, complete: () => void) => void

    /**
     * Called when we want the step to stop its execution. Should cleanup any resources it uses too such as timers and spawned units.
     */
    stop: (context: TutorialContext) => void
}

/**
 * Creates a tutorial step given the start function and optionally the stop function.
 * @param start Called when the step is started. Should call complete when the step is done. Can use context to share data with other steps.
 * @param stop Called when we want the step to stop its execution. Should cleanup any resources it uses too such as timers and spawned units. If not passed, does nothing on stop.
 */
export const step = (start: (context: TutorialContext, complete: () => void) => void, stop?: (context: TutorialContext) => void): TutorialStep => {
    // Default implementation for stop does nothing.
    if (!stop) {
        stop = () => { }
    }

    return { start, stop }
}

/**
 * Creates a tutorial step that waits for steps to complete in parallel before completing itself.
 * @param steps List of tutorial steps to wrap in parallel.
 */
export const fork = (...steps: TutorialStep[]): TutorialStep => {
    const stepsCompleted = steps.map(s => false)

    return step((context, onComplete) => {
        // Once all steps are completed, complete ourselves
        for (let i = 0; i < steps.length; i++) {
            const stepIndex = i
            steps[stepIndex].start(context, () => {
                stepsCompleted[stepIndex] = true
                if (stepsCompleted.every(c => c)) {
                    onComplete()
                }
            })
        }
    }, context => steps.forEach(step => step.stop(context)))
}

/**
 * Creates a tutorial step that executes individual steps one after another. The step completes when the final step was completed.
 * @param steps List of tutorial steps to wrap sequentially.
 */
export const seq = (...steps: TutorialStep[]): TutorialStep => {
    return step((context, onComplete) => {
        const startStep = (i: number) => {
            const step = steps[i]

            if (i + 1 >= steps.length) {
                step.start(context, onComplete)
            } else {
                step.start(context, () => startStep(i + 1))
            }
        }

        startStep(0)
    }, context => steps.forEach(step => step.stop(context)))
}

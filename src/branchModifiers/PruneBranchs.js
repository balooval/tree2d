class PruneBranchs {

    constructor(trunk, preset) {
        this.trunk = trunk;
        this.preset = preset;
    }

    apply(branchs) {
        const finalBranchs = this.trunk.getFinalBranchs();

        const branchsToPrune = [];
        for (let i = 0; i < finalBranchs.length; i ++) {
            const branch = finalBranchs[i];
            if (branch.parent === null) {
                continue;
            }
            const age = this.trunk.time - branch.time;
            if (age > this.preset.pruneAge) {
                const segment = branch.buildSegment([]);
                branchsToPrune.push(...segment);
                const firstBranch = segment.pop();
                if (!firstBranch) {
                    console.log('segment', segment);
                }
                firstBranch.parent.removeChild(firstBranch);
            }
        }

        return branchs.filter(branch => branchsToPrune.includes(branch) === false);
    }
}

export default PruneBranchs;
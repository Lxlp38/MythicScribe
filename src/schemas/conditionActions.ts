enum ConditionTypes {
	CHECK = "check",
	METASKILL = "metaskill",
	FLOAT = "float",
}

export const ConditionActions: { [key: string]: ConditionTypes } = {
	"true": ConditionTypes.CHECK,
	"false": ConditionTypes.CHECK,
	"cast": ConditionTypes.METASKILL,
	"castinstead": ConditionTypes.METASKILL,
	"orElseCast": ConditionTypes.METASKILL,
	"power": ConditionTypes.FLOAT
};

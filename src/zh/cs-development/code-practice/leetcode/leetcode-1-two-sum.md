---
icon: pen-to-square
date: 2024-01-05
category:
  - Leetcode
tag:
  - 容易
---
# 1. 两数之和


## 代码

```java
/**
 * @author ghp
 * @title 两数之和
 */
class Solution {
    public int[] twoSum(int[] nums, int target) {
    //16是HashMap初始化的建议值
        Map<Integer, Integer> map = new HashMap<>(16);
        for (int i = 0; i < nums.length; i++) {
		        //t 为需要在哈希表中找到的满足条件的数
            int t = target - nums[i];
            if (map.containsKey(t)) {
                // 当前i对应的元素+之前存入的Map的元素=target
                return new int[]{map.get(t), i};
            }
            map.put(nums[i], i);
        }
        // 根据题意，一定会存在一对答案的，所以这里永远不可达，随便返回一个啥都是可以的
        return new int[0];
    }
}
```

## 题解

---

先判断哈希表中是否存在对应的数，再将当前的数插入哈希表中。